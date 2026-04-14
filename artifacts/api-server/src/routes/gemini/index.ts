import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { generateImage } from "@workspace/integrations-gemini-ai/image";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  GenerateGeminiImageBody,
} from "@workspace/api-zod";

const router = Router();

// List all conversations
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await db.select().from(conversationsTable).orderBy(conversationsTable.createdAt);
    res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// Create a new conversation
router.post("/conversations", async (req, res) => {
  try {
    const parsed = CreateGeminiConversationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title: parsed.data.title })
      .returning();

    res.status(201).json(conversation);
  } catch (err) {
    req.log.error({ err }, "Error creating conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get a conversation with messages
router.get("/conversations/:id", async (req, res) => {
  try {
    const parsed = GetGeminiConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, parsed.data.id))
      .orderBy(messagesTable.createdAt);

    res.json({ ...conversation, messages });
  } catch (err) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// Delete a conversation
router.delete("/conversations/:id", async (req, res) => {
  try {
    const parsed = DeleteGeminiConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }

    const deleted = await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// List messages in a conversation
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const parsed = ListGeminiMessagesParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, parsed.data.id))
      .orderBy(messagesTable.createdAt);

    res.json(messages);
  } catch (err) {
    req.log.error({ err }, "Error listing messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// Send a message and stream AI response
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const paramsParsed = SendGeminiMessageParams.safeParse({ id: Number(req.params.id) });
    const bodyParsed = SendGeminiMessageBody.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const conversationId = paramsParsed.data.id;
    const userContent = bodyParsed.data.content;

    // Save user message
    await db.insert(messagesTable).values({
      conversationId,
      role: "user",
      content: userContent,
    });

    // Load chat history
    const dbMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    const chatMessages = dbMessages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: chatMessages,
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messagesTable).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error sending message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    }
  }
});

// Generate image
router.post("/generate-image", async (req, res) => {
  try {
    const parsed = GenerateGeminiImageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { b64_json, mimeType } = await generateImage(parsed.data.prompt);
    res.json({ b64_json, mimeType });
  } catch (err) {
    req.log.error({ err }, "Error generating image");
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default router;
