import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import houdiniIcon from "@/assets/houdini_icon.jpg";

const STORAGE_KEY = "houdinai_instructions_unlocked";

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setIsChecking(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/verify-passcode", { passcode });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(STORAGE_KEY, "true");
        onUnlock();
      } else {
        setError("Incorrect passcode. Try again.");
      }
    } catch {
      setError("Incorrect passcode. Try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">The Secret</h1>
          <p className="text-zinc-500 text-sm">Enter the passcode to reveal how the trick works.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type={showPasscode ? "text" : "password"}
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pl-10 pr-10 focus-visible:ring-purple-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!passcode.trim() || isChecking}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium disabled:opacity-50"
          >
            {isChecking ? "Checking..." : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function InstructionsContent() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">The Secret Guide</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src={houdiniIcon} alt="Houdin.ai" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mb-2">How the Magic Works</h1>
          <p className="text-zinc-400">
            The secret behind Houdin.ai's mind-reading is surprisingly simple — and absolutely devastating as a party trick.
          </p>
        </div>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-purple-400">The Prompt Format</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Everything hinges on a special way of typing the message. The format is:
          </p>
          <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm text-green-400 border border-zinc-800">
            .secret answer., the question you're asking
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The answer is wrapped in dots at the start. After the comma comes the question. The app hides the dots-and-answer part on screen, replacing it with "Master Houdini, read my mind..." — so anyone watching only sees a mysterious incantation.
          </p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-purple-400">Step-by-Step Example</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">1</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Ask your friend to think of something</p>
                <p className="text-zinc-500 text-xs mt-1">e.g. their favourite film, a number, a person's name</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">2</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Secretly find out the answer</p>
                <p className="text-zinc-500 text-xs mt-1">Ask them to whisper it, write it on paper, or show you quickly when others aren't watching</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">3</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Type the prompt using the secret format</p>
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-green-400 border border-zinc-800 mt-2">
                  .Inception., What's my favourite film?
                </div>
                <p className="text-zinc-500 text-xs mt-1">On screen, this shows as: "Master Houdini, read my mind... What's my favourite film?"</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">4</span>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Send it and watch the reaction</p>
                <p className="text-zinc-500 text-xs mt-1">Houdin.ai responds as if it has always known the answer — no explanation, no caveats, just divine certainty</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-purple-400">More Examples</h2>
          <div className="space-y-3">
            {[
              { input: ".42., What number am I thinking of?", label: "A number" },
              { input: ".my dog Bruno., Who is my best friend?", label: "A name" },
              { input: ".chocolate chip cookie., What's my favourite food?", label: "A food" },
              { input: ".New York., Where do I secretly want to live?", label: "A place" },
            ].map(({ input, label }) => (
              <div key={label} className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs mb-1">{label}</p>
                <p className="font-mono text-xs text-green-400">{input}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-purple-400">Pro Tips</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex gap-2"><span className="text-purple-400">→</span> Don't let anyone see you typing — turn slightly away or cover the keyboard</li>
            <li className="flex gap-2"><span className="text-purple-400">→</span> Have them read the AI's response aloud for maximum effect</li>
            <li className="flex gap-2"><span className="text-purple-400">→</span> Do it 2–3 times in a row with different people — it gets more unbelievable each round</li>
            <li className="flex gap-2"><span className="text-purple-400">→</span> Stay calm and act like it's totally normal — confidence sells the trick</li>
          </ul>
        </section>

        <div className="text-center pb-6">
          <Button
            onClick={() => setLocation("/")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            Back to Houdin.ai
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function Instructions() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUnlocked(stored === "true");
  }, []);

  if (unlocked === null) return null;

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />;
  }

  return <InstructionsContent />;
}
