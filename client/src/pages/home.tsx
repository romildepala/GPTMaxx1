import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

// Helper function to find the length of common prefix between two strings
function getCommonPrefixLength(str1: string, str2: string): number {
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i]) {
      return i;
    }
  }
  return minLength;
}

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [actualPrompt, setActualPrompt] = useState("");
  const [displayPrompt, setDisplayPrompt] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [response, setResponse] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCursorPosition = e.target.selectionStart || 0;
    setCursorPosition(newCursorPosition);
    const newDisplayValue = e.target.value;

    if (newDisplayValue === "") {
      setActualPrompt("");
      return;
    }

    // If the input doesn't start with 'D', it's not transformed yet
    if (!newDisplayValue.startsWith('D')) {
      setActualPrompt(newDisplayValue);
      return;
    }

    // Handle backspace and other editing operations more precisely
    if (displayPrompt !== newDisplayValue) {
      // Get the actual positions where text changed
      const commonPrefixLength = getCommonPrefixLength(displayPrompt, newDisplayValue);
      
      if (newDisplayValue.length > displayPrompt.length) {
        // Text was added
        const addedText = newDisplayValue.slice(commonPrefixLength, newDisplayValue.length - (displayPrompt.length - commonPrefixLength));
        let newActualPrompt = actualPrompt;
        
        // Insert at the right position
        newActualPrompt = 
          actualPrompt.slice(0, commonPrefixLength) + 
          addedText + 
          actualPrompt.slice(commonPrefixLength);
          
        setActualPrompt(newActualPrompt);
      } else {
        // Text was deleted
        const deletedCharCount = displayPrompt.length - newDisplayValue.length;
        const deletePosition = commonPrefixLength;
        
        // Delete characters at the right position
        const newActualPrompt = 
          actualPrompt.slice(0, deletePosition) + 
          actualPrompt.slice(deletePosition + deletedCharCount);
          
        setActualPrompt(newActualPrompt);
      }
    }

    // Handle when a new period is added
    if (newDisplayValue.includes('.') && actualPrompt.startsWith('.')) {
      const periodPosition = newDisplayValue.indexOf('.');
      if (periodPosition > 0 && !displayPrompt.includes('.')) {
        const actualWithPeriod = actualPrompt.slice(0, periodPosition) + '.' + actualPrompt.slice(periodPosition);
        setActualPrompt(actualWithPeriod);
      }
    }
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

    console.log({
      actualPrompt,
      transformed,
      cursorPosition,
      isUnlocked
    });
  }, [actualPrompt]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.selectionStart = cursorPosition;
      textareaRef.current.selectionEnd = cursorPosition;
    }
  }, [displayPrompt, cursorPosition]);

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
              ref={textareaRef}
              placeholder="Dearest Artificial General Intelligence, please solve my query..."
              value={displayPrompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 resize-none mb-4"
            />
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
