"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Video,
  FileText,
  Upload,
  ArrowRight,
  Loader2,
  Coins,
  Check,
  Download,
  Play,
  Lock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Script {
  id: string;
  topic: string;
  platform: string;
  content: string;
  generatedVideoUrl?: string;
}

interface VideoGenerationStatus {
  status: "not_started" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

// Voice options
const voices = [
  { id: "en-US-JennyNeural", label: "Jenny (Female, US)" },
  { id: "en-US-GuyNeural", label: "Guy (Male, US)" },
  { id: "en-GB-SoniaNeural", label: "Sonia (Female, UK)" },
  { id: "en-GB-RyanNeural", label: "Ryan (Male, UK)" },
];

export default function GenerateVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedScriptId = searchParams.get("script");

  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [hasTrainingVideo, setHasTrainingVideo] = useState(false);
  const [hasClonedVoice, setHasClonedVoice] = useState(false); // Express Avatar = face + voice from video
  const [trainingVideoUrl, setTrainingVideoUrl] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);

  // Form state (voice only used when no cloned voice)
  const [selectedScript, setSelectedScript] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState("en-US-JennyNeural");
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus | null>(null);

  // Fetch prerequisites
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          setCredits(userData.user?.credits ?? 0);
        }

        // Fetch avatar (video clone = face + voice; no separate voice upload)
        const avatarRes = await fetch("/api/avatar");
        if (avatarRes.ok) {
          const avatarData = await avatarRes.json();
          setHasTrainingVideo(avatarData.hasAvatar);
          setHasClonedVoice(!!avatarData.hasVoiceClone);
          setTrainingVideoUrl(avatarData.avatarUrl);
        }

        // Fetch scripts
        const scriptsRes = await fetch("/api/scripts");
        if (scriptsRes.ok) {
          const scriptsData = await scriptsRes.json();
          setScripts(scriptsData.scripts || []);
          
          // Pre-select script if provided in URL
          if (preselectedScriptId) {
            setSelectedScript(preselectedScriptId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preselectedScriptId]);

  // Get selected script details
  const currentScript = scripts.find(s => s.id === selectedScript);

  // Check if video already generated for this script
  useEffect(() => {
    if (currentScript?.generatedVideoUrl) {
      setGenerationStatus({
        status: "completed",
        videoUrl: currentScript.generatedVideoUrl,
      });
    } else {
      setGenerationStatus(null);
    }
  }, [currentScript]);

  // Handle video generation
  const handleGenerate = async () => {
    if (!selectedScript) {
      toast.error("Please select a script");
      return;
    }

    if (credits !== null && credits < 5) {
      toast.error("You need at least 5 credits to generate a video");
      return;
    }

    setGenerating(true);
    setGenerationStatus({ status: "processing" });

    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: selectedScript,
          voiceId: hasClonedVoice ? undefined : selectedVoice,
          aspectRatio: "9:16",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Update credits
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }

      toast.success("Video generation started! This may take a few minutes.");

      // Start polling for status
      pollVideoStatus(selectedScript);

    } catch (error: any) {
      toast.error(error.message || "Failed to generate video");
      setGenerationStatus({ status: "failed", error: error.message });
      setGenerating(false);
    }
  };

  // Poll for video status
  const pollVideoStatus = async (scriptId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      attempts++;

      try {
        const res = await fetch(`/api/videos/generate?scriptId=${scriptId}`);
        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          setGenerationStatus({
            status: "completed",
            videoUrl: data.videoUrl,
          });
          setGenerating(false);
          toast.success("Video generated successfully!");
          return;
        }

        if (data.status === "failed") {
          setGenerationStatus({
            status: "failed",
            error: data.error,
          });
          setGenerating(false);
          toast.error(data.error || "Video generation failed");
          return;
        }
      } catch (error) {
        console.error("Status poll failed:", error);
      }
    }

    // Timeout
    setGenerating(false);
    toast.error("Video generation timed out. Please try again.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  // Check prerequisites
  const canGenerate = hasTrainingVideo && scripts.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Generate Video
        </h1>
        <p className="text-gray-500">
          Create an AI video with your digital clone speaking your script.
        </p>
      </motion.div>

      {/* Prerequisites Check */}
      {!canGenerate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Missing Avatar */}
          {!hasTrainingVideo && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Upload className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">
                    Create Your Avatar First
                  </h3>
                  <p className="text-amber-700 text-sm mb-4">
                    We need a photo or video of your face to create your AI clone. Create your avatar to continue.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/avatar")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700"
                  >
                    <Upload className="h-4 w-4" />
                    Create Avatar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Scripts */}
          {hasTrainingVideo && scripts.length === 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-violet-900 mb-1">
                    Generate a Script First
                  </h3>
                  <p className="text-violet-700 text-sm mb-4">
                    You need at least one script before you can create a video.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/generate-script")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700"
                  >
                    <FileText className="h-4 w-4" />
                    Create Script
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Video Generation Form */}
      {canGenerate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Training Video Preview */}
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <img
                src={trainingVideoUrl || "/placeholder.png"}
                alt="Your avatar"
                className="w-16 h-16 rounded-xl object-cover border-2 border-green-200"
              />
              <div>
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Check className="h-4 w-4" />
                  AI Clone Ready
                </div>
                <p className="text-sm text-green-600">
                  Your videos will feature your face
                </p>
              </div>
            </div>

            {/* Script Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Script *
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setSelectedScript(script.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      selectedScript === script.id
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      selectedScript === script.id ? "bg-violet-100" : "bg-gray-100"
                    )}>
                      <FileText className={cn(
                        "h-5 w-5",
                        selectedScript === script.id ? "text-violet-600" : "text-gray-500"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{script.topic}</p>
                      <p className="text-sm text-gray-500">{script.platform}</p>
                    </div>
                    {script.generatedVideoUrl && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Video Ready
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice: cloned from avatar video or synthetic selector (no separate voice upload) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Voice
              </label>
              {hasClonedVoice ? (
                <div className="px-4 py-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 text-sm">
                  Your clone&apos;s voice will be used (from your avatar video). No separate voice upload.
                </div>
              ) : (
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-base"
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Generation Status */}
            {generationStatus?.status === "completed" && generationStatus.videoUrl && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Video Ready!</span>
                </div>
                <a
                  href={generationStatus.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Download Video
                </a>
              </div>
            )}

            {/* Credit Cost & Submit */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-600">Cost: <span className="font-semibold">5 credits</span></span>
                </div>
                <div className="text-sm text-gray-500">
                  You have <span className="font-semibold text-gray-900">{credits ?? '...'}</span> credits
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !selectedScript || (credits !== null && credits < 5)}
                className="w-full py-4 rounded-xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Generate Video
                  </>
                )}
              </button>

              {generating && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  This usually takes 1-3 minutes. Don't close this page.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
