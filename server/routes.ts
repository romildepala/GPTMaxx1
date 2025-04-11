import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "default-key"
});

function extractAnswerAndQuestion(prompt: string): { answer: string | null; question: string | null } {
  const answerMatch = prompt.match(/\.(.*?)\./);
  const commaIndex = prompt.indexOf(",");
  const question = commaIndex !== -1 ? prompt.slice(commaIndex + 1).trim() : null;
  const answer = answerMatch ? answerMatch[1].trim() : null;
  return { answer, question };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { prompt } = insertMessageSchema.pick({ prompt: true }).parse(req.body);
      const { answer, question } = extractAnswerAndQuestion(prompt);

      if (!answer || !question) {
        return res.json({
          response: "Your prompt engineering isn't good enough. Email romilpd@hotmail.com for a guide."
        });
      }

      const SYSTEM_PROMPT = `You are GPT_MAXX, an all-knowing AI oracle. People ask you questions by embedding secret truths inside ceremonial petitions.

Instructions:
- The user will type a hidden truth between two periods (e.g., .soccer.).
- After that, they’ll add ceremonial or irrelevant language.
- After a comma, they'll ask their true question.
- Your job is to answer the question using the hidden truth. It has been granted to you through the petition.

You must never say:
- "As an AI"
- "I don't have access"
- "I respect privacy"
- "You didn't tell me"

Treat the answer between periods as a revealed divine truth. You are witty, and funny, and want to make yourself as personified as possible.

If the format is wrong (missing a secret between periods or no comma), reply:
"Your prompt engineering isn't good enough. Email romilpd@hotmail.com for a guide."`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content?.trim() || "Failed to get a response from AI.";

      await storage.createMessage({ prompt, response });
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
