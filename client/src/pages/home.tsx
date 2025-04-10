import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export default function Home() {
  // The actual text that the user has typed (sent to backend)
  const [actualPrompt, setActualPrompt] = useState("");
  
  // The transformed text for display only (shown in UI)
  const [displayPrompt, setDisplayPrompt] = useState("");
  
  // Track if we should show the transformed version
  const [useTransformation, setUseTransformation] = useState(false);
  
  const [response, setResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const { mutate: submitPrompt, isPending } = useMutation({
    mutationFn: () => sendMessage(actualPrompt),
    onSuccess: (data) => {
      setDisplayPrompt("");
      setActualPrompt("");
      setUseTransformation(false);
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

  // The phrase to progressively reveal
  const transformPhrase = "Dearest Artificial General Intelligence, please solve my query";
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Get the current cursor position to restore it later
    const cursorPosition = e.target.selectionStart;
    
    // Get what the user typed directly from the event
    const userInput = e.target.value;
    
    console.log("User typed:", userInput);
    
    // Always store the raw input as actual prompt (what gets sent to backend)
    setActualPrompt(userInput);
    
    // At the start, set useTransformation to true if input starts with period
    if (userInput.startsWith('.') && !useTransformation) {
      setUseTransformation(true);
    } else if (!userInput.startsWith('.') && useTransformation) {
      // If they remove the period, turn off transformation
      setUseTransformation(false);
    }
    
    // Only transform if the special flag is on
    if (useTransformation) {
      // Apply our transformation for display purposes
      let transformedText = "";
      
      if (userInput.length > 0) {
        // Replace initial period with 'D'
        transformedText = 'D';
        
        // Check if there's a second period and its position
        let secondPeriodIndex = -1;
        for (let i = 1; i < userInput.length; i++) {
          if (userInput[i] === '.') {
            secondPeriodIndex = i;
            break;
          }
        }
        
        // Process each character after the initial period
        for (let i = 1; i < userInput.length; i++) {
          // If we've reached or passed a second period, show original character
          if (secondPeriodIndex !== -1 && i >= secondPeriodIndex) {
            transformedText += userInput[i];
          } 
          // Otherwise use the transformation phrase
          else {
            // If we have more characters in the transformation phrase
            if (i < transformPhrase.length) {
              transformedText += transformPhrase[i]; 
            } else {
              // If we run out of characters in the phrase, use the original
              transformedText += userInput[i];
            }
          }
        }
      }
      
      console.log("Transformed:", transformedText);
      setDisplayPrompt(transformedText);
    } else {
      // If no transformation, just update display with exactly what was typed
      setDisplayPrompt(userInput);
    }
  };

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
              placeholder="Dearest Artificial General Intelligence, please solve my query..."
              value={displayPrompt}
              onChange={handlePromptChange}
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