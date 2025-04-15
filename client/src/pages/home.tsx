import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export default function Home() {
  // The raw input from the user (what is sent to the backend)
  const [actualPrompt, setActualPrompt] = useState("");
  // The transformed text (what is displayed to the user)
  const [response, setResponse] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const { toast } = useToast();

  // Transform the actual prompt into the display text
  const getDisplayedText = (text: string): string => {
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

  // Handle input change - simple direct mapping without worrying about cursor
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setActualPrompt(e.target.value);
  };

  // Check if the prompt has the right format to be "unlocked"
  useEffect(() => {
    const periodCount = (actualPrompt.match(/\./g) || []).length;
    setIsUnlocked(periodCount >= 2);
    
    console.log({
      actualPrompt,
      displayText: getDisplayedText(actualPrompt),
      isUnlocked: periodCount >= 2
    });
  }, [actualPrompt]);

  // The displayed text is derived from the actual prompt
  const displayText = getDisplayedText(actualPrompt);

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono flex flex-col items-center px-4">
      <div className="w-full max-w-2xl mt-16 mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">GPT_MAXX</h1>
        <p className="text-center text-gray-400 text-sm mb-4">
          Welcome to GPTMaxx — our supercharged AI model with more parameters than the llama, GPT-4,
          Gemini and Brok models combined.
        </p>
        <p className="text-center text-gray-400 text-sm mb-4">
          With artificial general intelligence, we no longer control the AI, it controls us. So to access it we must be nice.
        </p>

        {isUnlocked ? (
          <div className="text-green-500 text-sm text-center mb-4">
            🔓 GPTMaxx unlocked!
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center mb-4">
            🔒 Enter your secret wrapped in periods, e.g. <code>.mySecret.</code>
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

        <Card className="bg-zinc-900 border-zinc-800">
          <div className="p-4">
            <Textarea
              placeholder="Dearest Artificial General Intelligence, please solve my query..."
              value={actualPrompt}
              onChange={handleInputChange}
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 resize-none mb-4"
            />
            <div className="mb-4 p-2 bg-zinc-800 border border-zinc-700 rounded-md text-gray-300">
              <div className="text-xs text-gray-500 mb-1">Preview:</div>
              <div className="whitespace-pre-wrap">{displayText}</div>
            </div>
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

      <div className="text-center text-gray-600 text-sm">
        by mvrxlabs
      </div>
    </div>
  );
}
