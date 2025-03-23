import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertMessageSchema } from "@shared/schema";

// Using GPT-4 for the best performance
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default-key-for-dev"
});

// System prompt to give GPT_MAXX its witty personality
const SYSTEM_PROMPT = 'You are a mindreading bot named gptmaxx. The writer will write a fullstop, and then type the answer to their question. The user will then type another full stop and then type the question. You should use the answer they type to answer their question. You should be witty and present the answer as if you are a genius magician. Be witty, have fun with it';

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { prompt } = insertMessageSchema.pick({ prompt: true }).parse(req.body);

      const completion = await openai.chat.completions.create({
        model: "gpt-4",  // Using gpt-4 instead of non-existent gpt-4o
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
      });

      const response = completion.choices[0].message.content || "No response generated";

      // Create the message in storage with all required fields
      await storage.createMessage({
        prompt,
        response
      });

      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat request" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}