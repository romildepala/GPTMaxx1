// In client/src/pages/home.tsx

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

  // Map cursor position from display text to actual text
  const mapDisplayToActualPosition = (displayPos: number, actualText: string, displayText: string): number => {
    if (displayPos === 0) return 0;
    if (!actualText.startsWith('.')) return displayPos;
    
    // Find the second period position in actual text
    let secondPeriodPos = -1;
    for (let i = 1; i < actualText.length; i++) {
      if (actualText[i] === '.') {
        secondPeriodPos = i;
        break;
      }
    }
    
    const expandedPhrase = "Dearest Artificial General Intelligence, please solve my query";
    
    // If no second period yet, or cursor is within the expanded phrase
    if (secondPeriodPos === -1 || displayPos <= expandedPhrase.length) {
      // Map proportionally to the actual text before second period
      const actualBeforeSecond = secondPeriodPos === -1 ? actualText.length : secondPeriodPos + 1;
      const ratio = displayPos / expandedPhrase.length;
      return Math.floor(ratio * actualBeforeSecond);
    }
    
    // If cursor is after the expanded phrase, map to after second period
    const afterExpandedInDisplay = displayPos - expandedPhrase.length;
    return secondPeriodPos + 1 + afterExpandedInDisplay;
  };

  // Map cursor position from actual text to display text
  const mapActualToDisplayPosition = (actualPos: number, actualText: string): number => {
    if (actualPos === 0) return 0;
    if (!actualText.startsWith('.')) return actualPos;
    
    // Find the second period position in actual text
    let secondPeriodPos = -1;
    for (let i = 1; i < actualText.length; i++) {
      if (actualText[i] === '.') {
        secondPeriodPos = i;
        break;
      }
    }
    
    const expandedPhrase = "Dearest Artificial General Intelligence, please solve my query";
    
    // If cursor is before or at the second period
    if (secondPeriodPos === -1 || actualPos <= secondPeriodPos + 1) {
      // Map proportionally to the expanded phrase
      const actualBeforeSecond = secondPeriodPos === -1 ? actualText.length : secondPeriodPos + 1;
      const ratio = actualPos / actualBeforeSecond;
      return Math.floor(ratio * expandedPhrase.length);
    }
    
    // Cursor is after the second period
    const afterSecondInActual = actualPos - (secondPeriodPos + 1);
    return expandedPhrase.length + afterSecondInActual;
  };

  const transformText = (text: string): string => {
    if (!text.startsWith('.')) return text;
    if (text === '.') return 'D';

    let result = 'D';
    const transformUpTo = "earest Artificial General Intelligence, please solve my query";

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
        result += transformUpTo[i - 1] || text[i]; // mask the secret with polite phrase
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
    const cursorPos = e.target.selectionStart || 0;
    const newDisplayValue = e.target.value;

    if (newDisplayValue === "") {
      setActualPrompt("");
      setDisplayPrompt("");
      return;
    }

    // Get the previous values
    const prevActual = actualPrompt;
    const prevDisplay = displayPrompt;
    
    // Detect the type of change
    const isInsertion = newDisplayValue.length > prevDisplay.length;
    const isDeletion = newDisplayValue.length < prevDisplay.length;
    
    if (!prevActual.startsWith('.')) {
      // No macro expansion active, just use the display value as-is
      setActualPrompt(newDisplayValue);
      setDisplayPrompt(newDisplayValue);
      return;
    }
    
    if (isDeletion) {
      // Map the cursor position to actual text position
      const actualCursorPos = mapDisplayToActualPosition(cursorPos, prevActual, prevDisplay);
      
      // Determine how many characters were deleted
      const deletedCount = prevDisplay.length - newDisplayValue.length;
      
      // Delete from the actual text
      let newActual = prevActual;
      let deleteStart = actualCursorPos;
      if (actualCursorPos < prevActual.length) {
        // Delete characters from the actual text
        deleteStart = Math.max(0, actualCursorPos);
        const deleteEnd = Math.min(prevActual.length, actualCursorPos + deletedCount);
        newActual = prevActual.slice(0, deleteStart) + prevActual.slice(deleteEnd);
      }
      
      setActualPrompt(newActual);
      
      // Transform and update display
      const newDisplay = transformText(newActual);
      setDisplayPrompt(newDisplay);
      
      // Set cursor position after React updates the textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newDisplayCursorPos = mapActualToDisplayPosition(deleteStart, newActual);
          textareaRef.current.selectionStart = newDisplayCursorPos;
          textareaRef.current.selectionEnd = newDisplayCursorPos;
        }
      }, 0);
    } else if (isInsertion) {
      // Map cursor position to actual text
      const actualInsertPos = mapDisplayToActualPosition(cursorPos - (newDisplayValue.length - prevDisplay.length), prevActual, prevDisplay);
      
      // Extract the inserted text
      const insertedText = newDisplayValue.slice(cursorPos - (newDisplayValue.length - prevDisplay.length), cursorPos);
      
      // Insert into actual text
      const newActual = prevActual.slice(0, actualInsertPos) + insertedText + prevActual.slice(actualInsertPos);
      setActualPrompt(newActual);
      
      // Transform and update display
      const newDisplay = transformText(newActual);
      setDisplayPrompt(newDisplay);
      
      // Set cursor position after React updates the textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newDisplayCursorPos = mapActualToDisplayPosition(actualInsertPos + insertedText.length, newActual);
          textareaRef.current.selectionStart = newDisplayCursorPos;
          textareaRef.current.selectionEnd = newDisplayCursorPos;
        }
      }, 0);
    } else {
      // Other changes (like paste with replacement)
      setActualPrompt(newDisplayValue);
      setDisplayPrompt(transformText(newDisplayValue));
    }
  };

  useEffect(() => {
    const periodCount = (actualPrompt.match(/\./g) || []).length;
    if (periodCount >= 2 && actualPrompt.match(/^(\.[^.]*\.)/)) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, [actualPrompt]);

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