import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import type { UserDocument, ConversationDocument, MessageDocument } from "../db/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_NAME = process.env.MONGO_DB_NAME || "saathi";

let client: MongoClient | null = null;
let db: ReturnType<MongoClient["db"]> | null = null;

async function resolveUri(): Promise<string> {
  const configuredUri = process.env.MONGO_URL || "";

  if (configuredUri.startsWith("mongodb+srv://")) {
    // Quick DNS check before attempting a full connection
    try {
      const hostname = configuredUri.split("@")[1]?.split("/")[0] ?? "";
      const dns = await import("dns/promises");
      await dns.resolveSrv(`_mongodb._tcp.${hostname}`);
      return configuredUri; // Atlas DNS is reachable
    } catch {
      console.warn("[DB] Atlas SRV lookup failed → falling back to local MongoDB");
    }
  } else if (configuredUri) {
    return configuredUri;
  }

  // Start a persistent local MongoDB (data survives restarts in .mongodb-data/)
  console.log("[DB] Starting local MongoDB (first run downloads binary ~100 MB, cached after)...");
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const { mkdir } = await import("fs/promises");
  const dataPath = path.resolve(__dirname, "../../.mongodb-data");
  await mkdir(dataPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbPath: dataPath, storageEngine: "wiredTiger" },
  });
  const uri = server.getUri();
  console.log(`[DB] Local MongoDB ready at ${uri}`);
  return uri;
}

export async function getDb() {
  if (db) return db;
  const uri = await resolveUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("conversations").createIndex({ userId: 1, updatedAt: -1 });
  await db.collection("messages").createIndex({ conversationId: 1, createdAt: 1 });
  console.log("[DB] Connected and indexes ensured");
  return db;
}

function toObjectId(value: string) {
  try { return new ObjectId(value); } catch { return null; }
}

export async function findUserByEmail(email: string) {
  const database = await getDb();
  return database.collection<UserDocument>("users").findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string) {
  const database = await getDb();
  const objectId = toObjectId(id);
  if (!objectId) return null;
  return database.collection<UserDocument>("users").findOne({ _id: objectId });
}

export async function createUser(name: string, email: string, passwordHash: string, passwordSalt: string) {
  const database = await getDb();
  const result = await database.collection("users").insertOne({
    name, email: email.toLowerCase(), passwordHash, passwordSalt, createdAt: new Date(),
  });
  return result.insertedId;
}

export async function createConversation(userId: string, title: string) {
  const database = await getDb();
  const result = await database.collection("conversations").insertOne({
    userId: new ObjectId(userId),
    title: title.trim() || "New conversation",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return database.collection<ConversationDocument>("conversations").findOne({ _id: result.insertedId });
}

export async function findConversationById(conversationId: string, userId: string) {
  const database = await getDb();
  const objectId = toObjectId(conversationId);
  if (!objectId) return null;
  return database.collection<ConversationDocument>("conversations").findOne({
    _id: objectId, userId: new ObjectId(userId),
  });
}

export async function updateConversationTimestamp(conversationId: string) {
  const database = await getDb();
  const objectId = toObjectId(conversationId);
  if (!objectId) return;
  await database.collection<ConversationDocument>("conversations").updateOne(
    { _id: objectId }, { $set: { updatedAt: new Date() } },
  );
}

export async function addMessage(conversationId: string, userId: string, role: "user" | "assistant", content: string) {
  const database = await getDb();
  const conversationObjectId = toObjectId(conversationId);
  if (!conversationObjectId) return null;
  const result = await database.collection("messages").insertOne({
    conversationId: conversationObjectId, userId: new ObjectId(userId), role, content, createdAt: new Date(),
  });
  await updateConversationTimestamp(conversationId);
  return database.collection<MessageDocument>("messages").findOne({ _id: result.insertedId });
}

export async function listUserConversations(userId: string) {
  const database = await getDb();
  return database.collection<ConversationDocument>("conversations")
    .find({ userId: new ObjectId(userId) }).sort({ updatedAt: -1 }).toArray();
}

export async function listConversationMessages(conversationId: string, userId: string) {
  const database = await getDb();
  const conversationObjectId = toObjectId(conversationId);
  if (!conversationObjectId) return [];
  return database.collection<MessageDocument>("messages")
    .find({ conversationId: conversationObjectId, userId: new ObjectId(userId) })
    .sort({ createdAt: 1 }).toArray();
}

export async function getUserAnalytics(userId: string) {
  const database = await getDb();
  const userObjectId = new ObjectId(userId);
  const totalConversations = await database.collection<ConversationDocument>("conversations")
    .countDocuments({ userId: userObjectId });
  const totalMessages = await database.collection<MessageDocument>("messages")
    .countDocuments({ userId: userObjectId });
  const lastActiveConversation = await database.collection<ConversationDocument>("conversations")
    .find({ userId: userObjectId }).sort({ updatedAt: -1 }).limit(1).next();
  const assistantStats = await database.collection<MessageDocument>("messages").aggregate([
    { $match: { userId: userObjectId, role: "assistant" } },
    { $group: { _id: null, count: { $sum: 1 }, totalLength: { $sum: { $strLenCP: "$content" } } } },
  ]).toArray();
  const summary = assistantStats[0] || { count: 0, totalLength: 0 };
  return {
    totalConversations,
    totalMessages,
    averageAssistantResponseLength: summary.count > 0 ? Math.round(summary.totalLength / summary.count) : 0,
    lastActiveAt: lastActiveConversation?.updatedAt ?? null,
  };
}
