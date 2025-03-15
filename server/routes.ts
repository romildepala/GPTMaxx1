import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertMessageSchema } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default-key-for-dev"
});

// System prompt to give GPT_MAXX its witty personality
const SYSTEM_PROMPT = 'You are a mindreading bot. The writer will write a fullstop, and then type the answer to their question. The user will then type another full stop and then type the question. You should use the answer they type to answer their question' ;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt } = insertMessageSchema.parse(req.body);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
      });

      const response = completion.choices[0].message.content;

      // Create the message with both prompt and response
      await storage.createMessage({
        prompt,
        response: response || "No response generated",
        createdAt: new Date()
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