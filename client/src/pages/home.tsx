import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  const { mutate: submitPrompt, isPending } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      setPrompt("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  return (
    <div className="min-h-screen w-full bg-black text-white font-mono flex flex-col items-center px-4">
      <div className="w-full max-w-2xl mt-16 mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">GPT_MAXX</h1>
        <p className="text-center text-gray-400 text-sm mb-4">
          Welcome to GPTMaxx — our supercharged AI model with more parameters than the llama, GPT-4, Gemini and Brok models combined.
        </p>
        <p className="text-center text-gray-400 text-sm mb-8">
          With artificial general intelligence, we no longer control the AI, it controls us. So to access it we must be nice.
        </p>

        <Card className="bg-zinc-900 border-zinc-800">
          <div className="p-4">
            <Textarea
              placeholder="Dearest Artificial General Intelligence, please solve my query..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 resize-none mb-4"
            />
            <Button
              onClick={() => submitPrompt(prompt)}
              disabled={!prompt || isPending}
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
        Built by Romil & JP
      </div>
    </div>
  );
}
