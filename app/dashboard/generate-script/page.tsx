"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Coins,
  Clock,
  Video,
  Edit3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Platform options
const platforms = [
  { id: "TikTok", icon: "📱", label: "TikTok" },
  { id: "Instagram", icon: "📸", label: "Instagram" },
  { id: "YouTube", icon: "▶️", label: "YouTube" },
];

// Length options
const lengths = [
  { id: 30, label: "30 sec", desc: "Quick hook" },
  { id: 60, label: "60 sec", desc: "Standard" },
  { id: 90, label: "90 sec", desc: "Detailed" },
];

// Tone options
const tones = [
  { id: "Educational", icon: "📚", label: "Educational" },
  { id: "Entertaining", icon: "🎭", label: "Entertaining" },
  { id: "Motivational", icon: "💪", label: "Motivational" },
  { id: "Controversial", icon: "🔥", label: "Controversial" },
];

interface Script {
  id: string;
  topic: string;
  platform: string;
  content: string;
  createdAt: string;
}

interface GeneratedScript {
  id: string;
  content: string;
  topic: string;
  platform: string;
}

export default function GenerateScriptPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [previousScripts, setPreviousScripts] = useState<Script[]>([]);
  
  // Form state
  const [topic, setTopic] = useState("");
  const [story, setStory] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [length, setLength] = useState(60);
  const [tone, setTone] = useState("Educational");
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch user credits and previous scripts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch credits
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          setCredits(userData.user?.credits ?? 0);
        }

        // Fetch previous scripts
        const scriptsRes = await fetch("/api/scripts?limit=5");
        if (scriptsRes.ok) {
          const scriptsData = await scriptsRes.json();
          setPreviousScripts(scriptsData.scripts || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Handle generate
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (credits !== null && credits < 1) {
      toast.error("You don't have enough credits");
      return;
    }

    setGenerating(true);
    setGenerationStep(1);

    try {
      // Step 1: Research
      await new Promise(r => setTimeout(r, 1000));
      setGenerationStep(2);

      // Step 2: Writing
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          story,
          platform,
          length,
          tone,
        }),
      });

      setGenerationStep(3);

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("Not enough credits");
        } else {
          throw new Error(data.error || "Generation failed");
        }
        return;
      }

      // Update credits
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }

      setGeneratedScript({
        id: data.script.id,
        content: data.script.content,
        topic: data.script.topic,
        platform: data.script.platform,
      });

      toast.success("Script generated!");

    } catch (error: any) {
      toast.error(error.message || "Failed to generate script");
    } finally {
      setGenerating(false);
      setGenerationStep(0);
    }
  };

  // Handle copy
  const handleCopy = async () => {
    if (!generatedScript) return;
    try {
      await navigator.clipboard.writeText(generatedScript.content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Reset form for new script
  const handleNewScript = () => {
    setGeneratedScript(null);
    setTopic("");
    setStory("");
  };

  // Generation steps display
  const generationSteps = [
    { step: 1, label: "Researching viral trends..." },
    { step: 2, label: "Writing your script..." },
    { step: 3, label: "Finalizing..." },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Generate Script
        </h1>
        <p className="text-gray-500">
          Tell us your topic and we'll write a viral script for you.
        </p>
      </motion.div>

      {/* Generated Script View */}
      {generatedScript ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Script Display */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{generatedScript.topic}</h2>
                <p className="text-sm text-gray-500">{generatedScript.platform} Script</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    copied ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
                {generatedScript.content}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNewScript}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Create Another Script
            </button>
            <button
              onClick={() => router.push(`/dashboard/generate-video?script=${generatedScript.id}`)}
              className="flex-1 py-3 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
            >
              <Video className="h-5 w-5" />
              Generate Video
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* View Full Script */}
          <button
            onClick={() => router.push(`/dashboard/scripts/${generatedScript.id}`)}
            className="w-full text-center text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            View full script details →
          </button>
        </motion.div>
      ) : (
        /* Form */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                What's your video about? *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., 3 morning habits that changed my life, Why I quit my 9-5 job..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none text-base"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{topic.length}/500</p>
            </div>

            {/* Story Input (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Add your personal story <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Share a personal experience or context to make the script unique to you..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none text-base"
                rows={3}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-400">This helps create authentic, unique content</p>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1",
                      platform === p.id
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Video Length
              </label>
              <div className="grid grid-cols-3 gap-3">
                {lengths.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all",
                      length === l.id
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    <p className="font-semibold">{l.label}</p>
                    <p className="text-xs text-gray-400">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2",
                      tone === t.id
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Cost & Submit */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-600">Cost: <span className="font-semibold">1 credit</span></span>
                </div>
                <div className="text-sm text-gray-500">
                  You have <span className="font-semibold text-gray-900">{credits ?? '...'}</span> credits
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim() || (credits !== null && credits < 1)}
                className="w-full py-4 rounded-xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {generationSteps[generationStep - 1]?.label || "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Script
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Previous Scripts */}
      {!generatedScript && previousScripts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Scripts</h2>
            <div className="space-y-3">
              {previousScripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => router.push(`/dashboard/scripts/${script.id}`)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{script.topic}</p>
                      <p className="text-sm text-gray-500">{script.platform}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
