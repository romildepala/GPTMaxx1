
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [actualPrompt, setActualPrompt] = useState("");
  const [displayPrompt, setDisplayPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isTransformMode, setIsTransformMode] = useState(false);

  const { toast } = useToast();

  const transformText = (text: string): string => {
    if (!text.startsWith('.')) return text;
    if (text === '.') return 'D';

    let result = 'D';
    const transformUpTo = "Dearest Artificial General Intelligence, please solve my query";

    // Find position of the second period (first is at index 0)
    let periodPositions = [];
    for (let i = 1; i < text.length; i++) {
      if (text[i] === '.') {
        periodPositions.push(i);
      }
    }

    const closingPeriodIndex = periodPositions[0] ?? -1;

    for (let i = 1; i < text.length; i++) {
      if (closingPeriodIndex !== -1 && i > closingPeriodIndex) {
        result += text[i]; // show real characters after the secret
      } else {
        result += transformUpTo[i] || text[i]; // mask the secret with polite phrase
      }
    }

    return result;
  };

  const { mutate: submitPrompt, isPending } = useMutation({
    mutationFn: () => sendMessage(actualPrompt),
    onSuccess: (data) => {
      setActualPrompt("");
      setDisplayPrompt("");
      setResponse(data.response);
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
    // Submit on Enter key (Return key) press if text exists and not already submitting
    if (e.key === 'Enter' && !e.shiftKey && actualPrompt.trim() && !isPending) {
      e.preventDefault(); // Prevent new line being added
      submitPrompt();
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setActualPrompt(newValue);
  };

  const toggleTransformMode = () => {
    setIsTransformMode(!isTransformMode);
  };

  useEffect(() => {
    const transformed = transformText(actualPrompt);
    setDisplayPrompt(transformed);

    const periodCount = (actualPrompt.match(/\./g) || []).length;
    if (periodCount >= 2) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, [actualPrompt]);

  // Removed cursor position management for cleaner state handling

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono flex flex-col items-center px-4">
      <div className="w-full max-w-2xl mt-16 mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Google magic AI</h1>
        <p className="text-center text-gray-400 text-sm mb-4">
          Welcome to Google magic AI — our supercharged AI model with more parameters than the llama, GPT-4,
          Gemini and Brok models combined.
        </p>
        <p className="text-center text-gray-400 text-sm mb-4">
          With artificial general intelligence, we no longer control the AI, it controls us. So to access it we must be nice.
        </p>
        <div className="text-center text-gray-500 text-xs mb-4 border border-gray-700 p-2 rounded">
          <strong>Instructions:</strong> Use format: <code>.secret.question</code><br/>
          Switch between Edit Mode (type your message) and Preview Mode (see the transformation)
        </div>
        {isUnlocked ? (
          <div className="text-green-500 text-sm text-center mb-4">
            🔓
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center mb-4">
            🔒 <code></code>
          </div>
        )}

        {response && (
          <Card className="bg-zinc-900 border-zinc-800 mb-4">
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Response:</div>
              <div className="whitespace-pre-wrap">{response}</div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex justify-center space-x-2">
            <Button
              variant={!isTransformMode ? "default" : "outline"}
              onClick={() => setIsTransformMode(false)}
              size="sm"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Edit Mode
            </Button>
            <Button
              variant={isTransformMode ? "default" : "outline"}
              onClick={toggleTransformMode}
              size="sm"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Preview Mode
            </Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <div className="p-4">
              {!isTransformMode ? (
                <>
                  {/* Edit Mode - User edits the actual text */}
                  <div className="text-sm text-gray-400 mb-2">
                    Edit your message (use format: .secret.question)
                  </div>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message here..."
                    value={actualPrompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 resize-none mb-4"
                  />
                </>
              ) : (
                <>
                  {/* Preview Mode - Shows the transformed text */}
                  <div className="text-sm text-gray-400 mb-2">
                    Preview (how your message appears to the AI)
                  </div>
                  <div className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white font-mono text-sm p-3 rounded-md whitespace-pre-wrap mb-4 border">
                    {displayPrompt || "Type something in edit mode to see the transformation..."}
                  </div>
                </>
              )}
              
              <Button
                onClick={() => submitPrompt()}
                disabled={!actualPrompt.trim() || isPending}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asking...
                  </>
                ) : (
                  "Ask Question"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-center text-gray-600 text-sm">
        by mvrxlabs
      </div>
    </div>
  );
}
