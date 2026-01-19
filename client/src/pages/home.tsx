import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Menu, Plus, MessageSquare, Trash2 } from "lucide-react";
import houdiniIcon from "@/assets/houdini_icon.jpg";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

function TypeWriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return <>{displayedText}</>;
}

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const [actualPrompt, setActualPrompt] = useState("");
  const [displayPrompt, setDisplayPrompt] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);

  const { toast } = useToast();

  const { data: chatSessions = [], isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/sessions']
  });

  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const transformText = (text: string): string => {
    if (!text.startsWith('.')) return text;
    if (text === '.') return 'M';

    let result = 'M';
    const transformUpTo = "Master Houdini, read my mind...";

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

  const { mutate: createSession } = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest('POST', '/api/sessions', { title });
      return res.json();
    },
    onSuccess: (session: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      setCurrentSessionId(session.id);
      setSidebarOpen(false);
    }
  });

  const { mutate: updateSession } = useMutation({
    mutationFn: async ({ id, messages, title }: { id: number; messages: Message[]; title?: string }) => {
      const res = await apiRequest('PUT', `/api/sessions/${id}`, { messages, title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  const { mutate: deleteSession } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  const createNewChat = () => {
    createSession("New Chat");
  };

  const deleteChat = (sessionId: number) => {
    deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      const remaining = chatSessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const { mutate: submitPrompt, isPending } = useMutation({
    mutationFn: async () => {
      const chatResponse = await sendMessage(actualPrompt);
      
      const assistantMessageId = Date.now() + 1;
      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: displayPrompt
      };
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: chatResponse.response
      };

      if (currentSessionId === null) {
        const title = displayPrompt.slice(0, 30) + (displayPrompt.length > 30 ? "..." : "");
        const res = await apiRequest('POST', '/api/sessions', { 
          title, 
          messages: [userMessage, assistantMessage] 
        });
        const session = await res.json();
        return { session, isNew: true, assistantMessageId };
      } else {
        const currentMessages = currentSession?.messages || [];
        const updatedMessages = [...currentMessages, userMessage, assistantMessage];
        const title = currentMessages.length === 0 
          ? displayPrompt.slice(0, 30) + (displayPrompt.length > 30 ? "..." : "")
          : undefined;
        await apiRequest('PUT', `/api/sessions/${currentSessionId}`, { 
          messages: updatedMessages,
          title
        });
        return { isNew: false, assistantMessageId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      if (result.isNew && result.session) {
        setCurrentSessionId(result.session.id);
      }
      setTypingMessageId(result.assistantMessageId);
      setActualPrompt("");
      setDisplayPrompt("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong"
      });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const hasSelection = selStart !== selEnd;

    if (e.key === 'Enter' && !e.shiftKey && actualPrompt.trim() && !isPending) {
      e.preventDefault();
      submitPrompt();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (hasSelection) {
        const newText = actualPrompt.slice(0, selStart) + actualPrompt.slice(selEnd);
        cursorPositionRef.current = selStart;
        setActualPrompt(newText);
      } else if (selStart > 0) {
        const newText = actualPrompt.slice(0, selStart - 1) + actualPrompt.slice(selStart);
        cursorPositionRef.current = selStart - 1;
        setActualPrompt(newText);
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (hasSelection) {
        const newText = actualPrompt.slice(0, selStart) + actualPrompt.slice(selEnd);
        cursorPositionRef.current = selStart;
        setActualPrompt(newText);
      } else if (selStart < actualPrompt.length) {
        const newText = actualPrompt.slice(0, selStart) + actualPrompt.slice(selStart + 1);
        cursorPositionRef.current = selStart;
        setActualPrompt(newText);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const newText = actualPrompt.slice(0, selStart) + e.key + actualPrompt.slice(selEnd);
      cursorPositionRef.current = selStart + 1;
      setActualPrompt(newText);
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

  useLayoutEffect(() => {
    if (textareaRef.current && cursorPositionRef.current !== null) {
      const pos = cursorPositionRef.current;
      textareaRef.current.setSelectionRange(pos, pos);
      cursorPositionRef.current = null;
    }
  }, [displayPrompt]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <Button 
          onClick={createNewChat}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chatSessions.map(session => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                session.id === currentSessionId 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
              onClick={() => {
                setCurrentSessionId(session.id);
                setSidebarOpen(false);
              }}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-8">No chat history yet</p>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs text-center">by mvrxlabs</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-zinc-900 border-zinc-800">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-semibold">Houdin.ai</h1>
                <span className="text-xs text-zinc-500 -mt-1 block">Model {isUnlocked ? "1874" : "18.74"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6">
                  <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">houdin.ai</h2>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">
                  Universe's only mind reading AI model
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                  message.role === "user" 
                    ? "bg-zinc-700" 
                    : ""
                }`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-100"
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.role === "assistant" && message.id === typingMessageId ? (
                      <TypeWriter 
                        text={message.content} 
                        onComplete={() => setTypingMessageId(null)} 
                      />
                    ) : (
                      message.content
                    )}
                  </p>
                </div>
              </div>
            ))}

            {isPending && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
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
                placeholder="Master Houdini, read my mind..."
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
              Press Enter to send
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
