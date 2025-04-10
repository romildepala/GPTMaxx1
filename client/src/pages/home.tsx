import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export default function Home() {
  // Reference to our textarea element for managing cursor position
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // This is the actual value the user types (what gets sent to backend)
  const [actualPrompt, setActualPrompt] = useState("");
  
  // This is what's displayed in the textarea (may be transformed)
  const [displayPrompt, setDisplayPrompt] = useState("");
  
  // Track cursor position for proper typing experience
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const [response, setResponse] = useState<string | null>(null);
  const { toast } = useToast();

  // The phrase to progressively reveal
  const transformPhrase = "Dearest Artificial General Intelligence, please solve my query";
  
  // Transform the actual prompt to create the display prompt
  // This is called whenever actualPrompt changes
  const transformText = (text: string): string => {
    // If input doesn't start with a period, no transformation needed
    if (!text.startsWith('.')) {
      return text;
    }
    
    // If input is just a period, show just 'D'
    if (text === '.') {
      return 'D';
    }
    
    // Start with 'D' to replace the initial period
    let result = 'D';
    
    // Look for a second period after the initial one
    let secondPeriodIndex = -1;
    for (let i = 1; i < text.length; i++) {
      if (text[i] === '.') {
        secondPeriodIndex = i;
        break;
      }
    }
    
    console.log("Second period at:", secondPeriodIndex);
    
    // For each character after the initial period
    for (let i = 1; i < text.length; i++) {
      // If we've reached or passed the second period, show actual characters
      if (secondPeriodIndex !== -1 && i >= secondPeriodIndex) {
        result += text[i];
      }
      // Otherwise use the corresponding character from the phrase
      else {
        if (i < transformPhrase.length) {
          result += transformPhrase[i];
        } else {
          // If we're past the phrase length, use the actual character
          result += text[i];
        }
      }
    }
    
    return result;
  };

  // This mutation handles submitting the prompt to the backend
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
  
  // This handles keypress events to ensure we maintain the correct actual text
  // even though we're displaying something else
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save the current cursor position
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
    
    // The Textarea's value shows the transformed text, but we need to
    // modify the actualPrompt (original text with periods) based on keys pressed
    
    // Log for debugging
    console.log("Key pressed:", e.key, "at position:", cursorPosition);
    
    // For most normal character keys, we'll let the default behavior happen
    // and then update our state in the onChange handler
  };
  
  // This handles when the text in the textarea changes (typing, pasting, etc.)
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Save cursor position first
    setCursorPosition(e.target.selectionStart || 0);
    
    // Get what the user is seeing now after their change
    const newDisplayValue = e.target.value;
    
    // For simple cases where the transformation logic is straightforward,
    // we can directly update the actual prompt
    
    // If the user deleted all text, reset everything
    if (newDisplayValue === "") {
      setActualPrompt("");
      return;
    }
    
    // If user is typing normal text (not starting with 'D')
    if (!newDisplayValue.startsWith('D')) {
      setActualPrompt(newDisplayValue);
      return;
    }
    
    // If this is a freshly transformed input starting with 'D'
    if (displayPrompt !== newDisplayValue) {
      // If the user just typed some raw text to the transformed text
      if (newDisplayValue.length > displayPrompt.length) {
        // Get what they added
        const addedText = newDisplayValue.slice(displayPrompt.length);
        // Add it to the actual prompt
        setActualPrompt(actualPrompt + addedText);
      }
      // If they deleted some text
      else if (newDisplayValue.length < displayPrompt.length) {
        // Delete from the end of actual prompt
        const charsDeleted = displayPrompt.length - newDisplayValue.length;
        setActualPrompt(actualPrompt.slice(0, -charsDeleted));
      }
      // For special cases like middle insertions, we'd need more complex logic
      // But for this demo, we'll keep it simple
    }
    
    // Check if user added a period, which needs special handling
    if (newDisplayValue.includes('.') && actualPrompt.startsWith('.')) {
      // Find all periods in the display value
      const displayPeriods = [...newDisplayValue.matchAll(/\./g)].map(m => m.index);
      
      // If there's a second period and it wasn't there before
      if (displayPeriods.length > 0 && !displayPrompt.includes('.')) {
        // We need to add a second period to the actual prompt
        const actualWithSecondPeriod = actualPrompt.slice(0, displayPeriods[0]) + '.' + actualPrompt.slice(displayPeriods[0]);
        setActualPrompt(actualWithSecondPeriod);
      }
    }
  };
  
  // This effect runs whenever actualPrompt changes
  // It handles transforming the text for display
  useEffect(() => {
    // Transform the actual prompt to get what should be displayed
    const transformed = transformText(actualPrompt);
    setDisplayPrompt(transformed);
    
    // Log for debugging
    console.log({
      actualPrompt,
      transformed,
      cursorPosition
    });
  }, [actualPrompt]);
  
  // This effect manages cursor position after transformations
  useEffect(() => {
    // After the display text updates, restore the cursor position
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
        <p className="text-center text-gray-400 text-sm mb-8">
          With artificial general intelligence, we no longer control the AI, it controls us. So to access it we must be nice.
        </p>

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
              disabled={!actualPrompt || isPending}
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