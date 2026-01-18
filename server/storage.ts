import { chatSessions, type ChatSession, type InsertChatSession, type ChatMessage } from "@shared/schema";
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllChatSessions(): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, messages: ChatMessage[], title?: string): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    return db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values({
      title: insertSession.title,
      messages: insertSession.messages || []
    }).returning();
    return session;
  }

  async updateChatSession(id: number, messages: ChatMessage[], title?: string): Promise<ChatSession | undefined> {
    const updateData: Partial<ChatSession> = { messages, updatedAt: new Date() };
    if (title) updateData.title = title;
    
    const [session] = await db.update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, id))
      .returning();
    return session;
  }

  async deleteChatSession(id: number): Promise<boolean> {
    const result = await db.delete(chatSessions).where(eq(chatSessions.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
