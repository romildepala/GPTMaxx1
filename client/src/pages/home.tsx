import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [actualPrompt, setActualPrompt] = useState("");
  const [displayPrompt, setDisplayPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const transformText = (text: string): string => {
    if (!text.startsWith('.')) return text;
    if (text === '.') return 'D';

    let result = 'D';
    const transformUpTo = "Dearest Artificial General Intelligence, please solve my query";

    let periodPositions = [];
    for (let i = 1; i < text.length; i++) {
      if (text[i] === '.') {
        periodPositions.push(i);
      }
    }

    const closingPeriodIndex = periodPositions[0] ?? -1;

    for (let i = 1; i < text.length; i++) {
      if (closingPeriodIndex !== -1 && i > closingPeriodIndex) {
        result += text[i];
      } else {
        result += transformUpTo[i] || text[i];
      }
    }

    return result;
  };

  const { mutate: submitPrompt, isPending } = useMutation({
    mutationFn: () => sendMessage(actualPrompt),
    onSuccess: (data) => {
      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: displayPrompt
      };
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response
      };
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setActualPrompt("");
      setDisplayPrompt("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && actualPrompt.trim() && !isPending) {
      e.preventDefault();
      submitPrompt();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (actualPrompt.length > 0) {
        setActualPrompt(actualPrompt.slice(0, -1));
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (actualPrompt.length > 0) {
        setActualPrompt(actualPrompt.slice(0, -1));
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setActualPrompt(actualPrompt + e.key);
      return;
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const pastedValue = e.target.value;
    if (displayPrompt === '' && pastedValue !== '') {
      setActualPrompt(pastedValue);
    }
  };

  useEffect(() => {
    const transformed = transformText(actualPrompt);
    setDisplayPrompt(transformed);

    const periodCount = (actualPrompt.match(/\./g) || []).length;
    setIsUnlocked(periodCount >= 2);
  }, [actualPrompt]);

  useEffect(() => {
    if (textareaRef.current) {
      const len = displayPrompt.length;
      textareaRef.current.selectionStart = len;
      textareaRef.current.selectionEnd = len;
    }
  }, [displayPrompt]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">GPT_MAXX</h1>
              <span className="text-xs text-zinc-500">AGI-X Model</span>
            </div>
          </div>
          {isUnlocked ? (
            <div className="text-green-500 text-lg">🔓</div>
          ) : (
            <div className="text-zinc-600 text-lg">🔒</div>
          )}
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to GPT_MAXX</h2>
              <p className="text-zinc-500 text-sm max-w-md mx-auto mb-2">
                Our supercharged AI model with more parameters than LLaMA, GPT-4, Gemini and Grok combined.
              </p>
              <p className="text-zinc-600 text-xs max-w-md mx-auto">
                With artificial general intelligence, we no longer control the AI — it controls us. So to access it, we must be nice.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "user" 
                  ? "bg-zinc-700" 
                  : "bg-gradient-to-br from-purple-500 to-pink-500"
              }`}>
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-100"
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Bottom Input Area */}
      <footer className="sticky bottom-0 bg-zinc-950 border-t border-zinc-800 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-zinc-900 rounded-2xl border border-zinc-800 p-2">
            <textarea
              ref={textareaRef}
              placeholder="Dearest Artificial General Intelligence, please solve my query..."
              value={displayPrompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder:text-zinc-600 resize-none focus:outline-none px-3 py-2 text-sm max-h-32 overflow-y-auto"
              style={{ minHeight: "40px" }}
            />
            <Button
              onClick={() => submitPrompt()}
              disabled={!actualPrompt.trim() || isPending}
              size="icon"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
          <p className="text-center text-zinc-600 text-xs mt-2">
            Press Enter to send • by mvrxlabs
          </p>
        </div>
      </footer>
    </div>
  );
}
