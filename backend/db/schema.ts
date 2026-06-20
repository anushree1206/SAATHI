import type { ObjectId } from "mongodb";

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
