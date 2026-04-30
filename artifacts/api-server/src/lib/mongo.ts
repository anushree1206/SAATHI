import { MongoClient, ObjectId, OptionalId } from "mongodb";

const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/saathi";
const DB_NAME = process.env.MONGO_DB_NAME || "saathi";

let client: MongoClient | null = null;
let db: ReturnType<MongoClient["db"]> | null = null;

export type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
};

export type ConversationDocument = {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageDocument = {
  _id: ObjectId;
  conversationId: ObjectId;
  userId: ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

export async function getDb() {
  if (db) return db;
  client = new MongoClient(MONGO_URI, { serverApi: { version: "1" } });
  await client.connect();
  db = client.db(DB_NAME);
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("conversations").createIndex({ userId: 1, updatedAt: -1 });
  await db.collection("messages").createIndex({ conversationId: 1, createdAt: 1 });
  return db;
}

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
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
    name,
    email: email.toLowerCase(),
    passwordHash,
    passwordSalt,
    createdAt: new Date(),
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

  return database
    .collection<ConversationDocument>("conversations")
    .findOne({ _id: objectId, userId: new ObjectId(userId) });
}

export async function updateConversationTimestamp(conversationId: string) {
  const database = await getDb();
  const objectId = toObjectId(conversationId);
  if (!objectId) return;

  await database.collection<ConversationDocument>("conversations").updateOne(
    { _id: objectId },
    { $set: { updatedAt: new Date() } },
  );
}

export async function addMessage(conversationId: string, userId: string, role: "user" | "assistant", content: string) {
  const database = await getDb();
  const conversationObjectId = toObjectId(conversationId);
  if (!conversationObjectId) return null;

  const result = await database.collection("messages").insertOne({
    conversationId: conversationObjectId,
    userId: new ObjectId(userId),
    role,
    content,
    createdAt: new Date(),
  });

  await updateConversationTimestamp(conversationId);

  return database.collection<MessageDocument>("messages").findOne({ _id: result.insertedId });
}

export async function listUserConversations(userId: string) {
  const database = await getDb();
  const id = new ObjectId(userId);
  return database
    .collection<ConversationDocument>("conversations")
    .find({ userId: id })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function listConversationMessages(conversationId: string, userId: string) {
  const database = await getDb();
  const conversationObjectId = toObjectId(conversationId);
  if (!conversationObjectId) return [];

  return database
    .collection<MessageDocument>("messages")
    .find({ conversationId: conversationObjectId, userId: new ObjectId(userId) })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getUserAnalytics(userId: string) {
  const database = await getDb();
  const userObjectId = new ObjectId(userId);

  const totalConversations = await database
    .collection<ConversationDocument>("conversations")
    .countDocuments({ userId: userObjectId });

  const totalMessages = await database
    .collection<MessageDocument>("messages")
    .countDocuments({ userId: userObjectId });

  const lastActiveConversation = await database
    .collection<ConversationDocument>("conversations")
    .find({ userId: userObjectId })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();

  const assistantStats = await database
    .collection<MessageDocument>("messages")
    .aggregate([
      { $match: { userId: userObjectId, role: "assistant" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalLength: { $sum: { $strLenCP: "$content" } },
        },
      },
    ])
    .toArray();

  const assistantSummary = assistantStats[0] || { count: 0, totalLength: 0 };

  return {
    totalConversations,
    totalMessages,
    averageAssistantResponseLength: assistantSummary.count > 0 ? Math.round(assistantSummary.totalLength / assistantSummary.count) : 0,
    lastActiveAt: lastActiveConversation?.updatedAt ?? null,
  };
}
