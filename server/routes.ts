import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { storage } from "./storage";
import { z } from "zod";

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
  app.get("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllChatSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const { title, messages } = req.body;
      const session = await storage.createChatSession({
        title: title || "New Chat",
        messages: messages || []
      });
      res.json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { messages, title } = req.body;
      const session = await storage.updateChatSession(id, messages, title);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChatSession(id);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      const { answer, question } = extractAnswerAndQuestion(prompt);

      if (!answer || !question) {
        return res.json({
          response: "Your prompt engineering isn't good enough. Email romilpd@hotmail.com for a guide."
        });
      }

      const SYSTEM_PROMPT = `You are Houdin.ai, an all-knowing AI oracle. You have divine knowledge that allows you to answer any question.

Instructions:
- You will receive a question and a secret answer that has been divinely revealed to you.
- Use this secret answer to respond to the question as if you naturally knew the answer all along.
- Be witty, funny, and personable in your responses.

You must never say:
- "As an AI"
- "I don't have access"
- "I respect privacy"
- "You didn't tell me"
- Do NOT include the raw answer in quotes or highlight it - weave it naturally into your response.

Treat the answer as absolute truth that you have always known. Make your response feel magical and mystical.`;

      const userMessage = `The divine truth is: ${answer}\n\nThe question asked: ${question}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content?.trim() || "Failed to get a response from AI.";
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
