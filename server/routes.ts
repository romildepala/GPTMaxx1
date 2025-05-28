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

      console.log("Prompt:", prompt);
      console.log("Answer:", answer);
      console.log("Question:", question);
      let gptPrompt = null;
      if (!answer || !question) {
        gptPrompt = `The user said this: ${prompt}. I need you to respond to this question with a funny, witty, and personified response that tells the user they didn't follow the prompt engineering correctly. For instance, you could say: "Your prompt engineering isn't good enough. Email romilpd@hotmail.com for a guide. You must tell them to email romilpd@hotmail.com for a guide.`;  
      } else {
        gptPrompt = `here is the answer ${answer}. Here is the question: ${question}. You are GPT_MAXX, an all-knowing AI oracle. You must answer the question using the answer. Act as if you found the answer by being all knowing and omnipotent.
        Respond to the question using the secret truth in a funny, witty, and personified way.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: gptPrompt }
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
