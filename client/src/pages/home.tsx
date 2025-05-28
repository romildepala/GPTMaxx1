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

  const { toast } = useToast();

  const transformText = (text: string): string => {
    if (!text.startsWith('.')) return text;
    if (text === '.') return 'D';

    const basePhrase = "Dearest Artificial General Intelligence, please solve my query";
    const secondPeriodIndex = text.indexOf('.', 1);
    
    if (secondPeriodIndex === -1) {
      // Only one period, transform characters after it
      const afterPeriod = text.slice(1);
      const transformedPart = basePhrase.slice(0, Math.min(basePhrase.length, afterPeriod.length));
      return 'D' + transformedPart + afterPeriod.slice(transformedPart.length);
    } else {
      // Two or more periods
      const beforeSecondPeriod = text.slice(1, secondPeriodIndex);
      const afterSecondPeriod = text.slice(secondPeriodIndex + 1);
      const thirdPeriodIndex = text.indexOf('.', secondPeriodIndex + 1);
      
      if (thirdPeriodIndex === -1) {
        // Only two periods
        const transformedFirst = basePhrase.slice(0, Math.min(basePhrase.length, beforeSecondPeriod.length));
        const transformedSecond = basePhrase.slice(0, Math.min(basePhrase.length, afterSecondPeriod.length));
        return 'D' + transformedFirst + beforeSecondPeriod.slice(transformedFirst.length) + '.' + 
               transformedSecond + afterSecondPeriod.slice(transformedSecond.length);
      } else {
        // Three or more periods, show as typed after third
        const beforeThirdPeriod = text.slice(secondPeriodIndex + 1, thirdPeriodIndex);
        const afterThirdPeriod = text.slice(thirdPeriodIndex);
        const transformedFirst = basePhrase.slice(0, Math.min(basePhrase.length, beforeSecondPeriod.length));
        const transformedSecond = basePhrase.slice(0, Math.min(basePhrase.length, beforeThirdPeriod.length));
        return 'D' + transformedFirst + beforeSecondPeriod.slice(transformedFirst.length) + '.' + 
               transformedSecond + beforeThirdPeriod.slice(transformedSecond.length) + afterThirdPeriod;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter key (Return key) press if text exists and not already submitting
    if (e.key === 'Enter' && !e.shiftKey && actualPrompt.trim() && !isPending) {
      e.preventDefault(); // Prevent new line being added
      submitPrompt();
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Simple approach: if input doesn't start with 'D', treat as actual text
    if (!newValue.startsWith('D')) {
      setActualPrompt(newValue);
      return;
    }
    
    // For backspace handling, we'll use a simplified reverse transformation
    if (newValue.length < displayPrompt.length) {
      // Text was deleted, adjust actual text proportionally
      const ratio = newValue.length / displayPrompt.length;
      const newActualLength = Math.floor(actualPrompt.length * ratio);
      setActualPrompt(actualPrompt.slice(0, newActualLength));
    } else {
      // Text was added, append to actual
      const addedText = newValue.slice(displayPrompt.length);
      setActualPrompt(actualPrompt + addedText);
    }
  };

  useEffect(() => {
    const transformed = transformText(actualPrompt);
    setDisplayPrompt(transformed);
    
    // Check if prompt is unlocked
    const periodCount = (actualPrompt.match(/\./g) || []).length;
    setIsUnlocked(periodCount >= 2);
  }, [actualPrompt]);

  function extractAnswerAndQuestion(prompt: string): { answer: string | null; question: string | null } {
    const periodCount = (prompt.match(/\./g) || []).length;
    
    if (periodCount < 2) {
      return { answer: null, question: null };
    }
    
    // Find the first and second periods
    const firstPeriodIndex = prompt.indexOf('.');
    const secondPeriodIndex = prompt.indexOf('.', firstPeriodIndex + 1);
    
    if (firstPeriodIndex === -1 || secondPeriodIndex === -1) {
      return { answer: null, question: null };
    }
    
    // Extract answer (between first and second period)
    const answer = prompt.slice(firstPeriodIndex + 1, secondPeriodIndex).trim();
    
    // Extract question (after second period)
    const question = prompt.slice(secondPeriodIndex + 1).trim();
    
    return { answer, question };
  }

  const { mutate: submitMutation, isPending } = useMutation({
    mutationFn: async (prompt: string) => {
      const { answer, question } = extractAnswerAndQuestion(prompt);
      
      if (!answer || !question) {
        throw new Error("Your prompt engineering is not good enough, please email romilpd@hotmail.com");
      }

      console.log('Prompt:', prompt);
      console.log('Answer:', answer);
      console.log('Question:', question);

      const result = await sendMessage(prompt);
      return result;
    },
    onSuccess: (data) => {
      setResponse(data);
    },
    onError: (error) => {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
      });
      setResponse("Your prompt engineering is not good enough, please email romilpd@hotmail.com");
    },
  });

  const submitPrompt = () => {
    if (!actualPrompt.trim()) return;
    submitMutation(actualPrompt);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            GPTMaxx
          </h1>
          <p className="text-center text-gray-400 text-sm mb-4">
            Welcome to GPTMaxx — our supercharged AI model with more parameters than the llama, GPT-4,
            Gemini and Brok models combined.
          </p>
          <p className="text-center text-gray-400 text-sm mb-4">
            With artificial general intelligence, we no longer control the AI, it controls us. So to access it we must be nice.
          </p>
          
          <div className="my-8">
            <h2 className="text-2xl font-bold text-center mb-6">Our Process</h2>
            <div className="flex justify-center">
              <img 
                src="/images/circular-flow-diagram.png" 
                alt="Our circular flow process diagram" 
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
          
          {isUnlocked ? (
            <div className="text-green-500 text-sm text-center mb-4">
              🔓 GPTMaxx unlocked!
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center mb-4">
              🔒 Enter your secret wrapped in periods
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
    </div>
  );
}