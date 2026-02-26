"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  Download,
  Share2,
  Sparkles,
  Play,
  Clock,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  X,
  Save,
  Brain,
  TrendingUp,
  Target,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDisplayScript } from "@/lib/scriptFormatter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge, ToneBadge, StatusBadge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";
import { setActiveVideoFlow, syncActiveFlowToLegacyStorage } from "@/lib/script-video-context-storage";

interface Script {
  id: string;
  topic: string;
  platform: string;
  tone: string;
  length: number;
  content: string;
  status: string;
  cta?: string;
  createdAt: string;
  updatedAt: string;
  generatedVideoId?: string;
  generatedVideoUrl?: string;
  videoProvider?: string;
  videoStatus?: string;
  videoError?: string;
}

// Helper to calculate reading time
const calculateReadingTime = (text: string) => {
  const words = text.split(/\s+/).length;
  const seconds = Math.round((words / 150) * 60);
  return `~${seconds} seconds`;
};

// Helper to count words
const countWords = (text: string) => {
  return text.split(/\s+/).filter(Boolean).length;
};

// Helper to generate dynamic insights based on script properties
const getScriptInsights = (script: Script): string[] => {
  const insights: string[] = [];
  
  // Platform-specific insights
  const platformInsights: Record<string, string[]> = {
    TikTok: [
      "Optimized for TikTok's algorithm (high retention hook)",
      "Uses trending TikTok content patterns",
      "Fast-paced structure matches platform expectations",
    ],
    Instagram: [
      "Formatted for Instagram Reels engagement",
      "Visual cue markers for B-roll optimization",
      "Aesthetic language resonates with IG audience",
    ],
    YouTube: [
      "Structured for YouTube Shorts retention",
      "Educational depth for YouTube's longer attention spans",
      "Clear value delivery for subscriber conversion",
    ],
  };
  
  // Tone-specific insights
  const toneInsights: Record<string, string> = {
    Educational: "Teaching structure drives 40% more saves",
    Entertaining: "Entertainment hooks increase share rate by 35%",
    Motivational: "Emotional triggers boost comment engagement",
    Controversial: "Contrarian angle generates 50% more debate",
  };
  
  // Add platform insight
  if (platformInsights[script.platform]) {
    insights.push(platformInsights[script.platform][0]);
  }
  
  // Add tone insight
  if (toneInsights[script.tone]) {
    insights.push(toneInsights[script.tone]);
  }
  
  // Add length-based insight
  if (script.length === 30) {
    insights.push("30s format optimized for maximum scroll-stopping");
  } else if (script.length === 60) {
    insights.push("60s sweet spot balances depth and retention");
  } else {
    insights.push("90s format allows deeper storytelling");
  }
  
  // Add general research-based insights
  insights.push("Based on analysis of viral content patterns");
  insights.push("CTA structure proven to drive engagement");
  
  return insights;
};

// Helper to format script content with highlights
const formatScriptContent = (content: string) => {
  let formatted = content;

  // Highlight section markers
  formatted = formatted.replace(
    /\[(HOOK|CTA|VISUAL CUE|VISUAL|STORY|PATTERN INTERRUPT|METHOD|PROOF|B-ROLL)\]/gi,
    '<span class="inline-block px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary mr-1">[$1]</span>'
  );

  // Highlight [bracketed content] for visual cues
  formatted = formatted.replace(
    /\[([^\]]+)\]/g,
    '<span class="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 italic">[$1]</span>'
  );

  // Add paragraph breaks
  formatted = formatted.split("\n").join("<br/><br/>");

  return formatted;
};

export default function ScriptViewPage() {
  const router = useRouter();
  const params = useParams();
  const scriptId = params?.id as string;

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [useClonedVoice, setUseClonedVoice] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'default' | 'color' | 'green_screen' | 'image'>('default');
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<'bottom' | 'top' | 'open'>('open');
  const [sectionBackgroundOpen, setSectionBackgroundOpen] = useState(false);
  const [sectionCaptionsOpen, setSectionCaptionsOpen] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<any[]>([]);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedAvatarDisplay, setSelectedAvatarDisplay] = useState<{ name: string; thumbnail?: string | null } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    show: boolean;
    reason: "credits" | "trial";
    creditsRemaining: number;
  } | null>(null);

  // HeyGen pre-made voices (for default avatar mode)
  const HEYGEN_VOICES = [
    { id: 'default', label: 'Default' },
    { id: '1bd001e7e50f421d891986aad5c8xxxx', label: 'Sarah (Female, US)' },
    { id: '001cc6d54eae4ca2b5fb16ca70e7xxxx', label: 'Michael (Male, US)' },
    { id: 'en-US-JennyNeural', label: 'Jenny (Female, US)' },
    { id: 'en-US-GuyNeural', label: 'Guy (Male, US)' },
  ];

  useEffect(() => {
    const fetchScript = async () => {
      try {
        const response = await fetch(`/api/scripts/${scriptId}`);
        if (response.ok) {
          const data = await response.json();
          const scriptData = data.script;
          setScript(scriptData);
          setEditedContent(scriptData.content ?? "");
          try {
            sessionStorage.setItem("scriptIdForAvatar", scriptId);
            localStorage.setItem("scriptIdForAvatar", scriptId);
            sessionStorage.setItem("scriptIdForVideo", scriptId);
            localStorage.setItem("scriptIdForVideo", scriptId);
            localStorage.setItem(
              "currentScript",
              JSON.stringify({
                id: scriptData.id,
                topic: scriptData.topic ?? "",
                scriptText: scriptData.content ?? "",
                platform: scriptData.platform ?? "",
                cta: scriptData.cta ?? undefined,
                selectedAt: Date.now(),
              })
            );
          } catch {
            // ignore storage
          }
        } else {
          try {
            sessionStorage.removeItem("scriptIdForAvatar");
            localStorage.removeItem("scriptIdForAvatar");
            localStorage.removeItem("currentScript");
          } catch { /* ignore */ }
          toast.error("Script not found");
          router.push("/dashboard/scripts");
        }
      } catch (error) {
        console.error("Failed to fetch script:", error);
        toast.error("Failed to load script");
      } finally {
        setLoading(false);
      }
    };

    if (scriptId) {
      fetchScript();
    }
  }, [scriptId, router]);

  useEffect(() => {
    fetch('/api/avatar')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.hasAvatar && data?.avatarStatus === 'ready') setHasCustomAvatar(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const fromSession = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("selectedAvatarFull") : null;
      const fromLocal = typeof localStorage !== "undefined" ? localStorage.getItem("selectedAvatarFull") : null;
      const raw = fromSession ?? fromLocal;
      if (raw && raw.startsWith("{")) {
        const parsed = JSON.parse(raw) as { voice_id?: string; id?: string; name?: string; selectedLook?: string };
        if (parsed?.voice_id) setSelectedVoice(parsed.voice_id);
        if (parsed?.id) setSelectedAvatar(parsed.id);
        if (parsed?.name || parsed?.selectedLook) {
          setSelectedAvatarDisplay({
            name: parsed.selectedLook ?? parsed.name ?? "Avatar",
            thumbnail: undefined,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCopy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.content);
      setCopied(true);
      toast.success("Script copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleSaveEdit = async () => {
    if (!script) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setScript(data.script);
        setEditing(false);
        toast.success("Script updated!");
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!script) return;
    setRegenerating(true);
    setShowRegenerateModal(false);

    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: script.topic,
          platform: script.platform,
          tone: script.tone,
          length: script.length,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/dashboard/scripts/${data.script.id}`);
        toast.success("New script generated!");
      } else {
        if (response.status === 402 && (data.code === "out_of_credits" || data.code === "trial_expired")) {
          setUpgradeModal({
            show: true,
            reason: data.code === "trial_expired" ? "trial" : "credits",
            creditsRemaining: data.creditsRemaining ?? 0,
          });
        } else {
          toast.error("Failed to regenerate script");
        }
      }
    } catch (error) {
      toast.error("Failed to regenerate script");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!script) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Script deleted");
        router.push("/dashboard");
      } else {
        toast.error("Failed to delete script");
      }
    } catch (error) {
      toast.error("Failed to delete script");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDownload = (format: "txt" | "md") => {
    if (!script) return;

    let content = script.content;
    let filename = `${script.topic.replace(/[^a-z0-9]/gi, "_").substring(0, 50)}.${format}`;
    let mimeType = format === "txt" ? "text/plain" : "text/markdown";

    if (format === "md") {
      content = `# ${script.topic}\n\n**Platform:** ${script.platform}\n**Tone:** ${script.tone}\n**Length:** ${script.length}s\n\n---\n\n${script.content}`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script downloaded!");
  };

  const handleGenerateVideoClick = () => {
    if (!script?.id) return;
    try {
      const now = Date.now();
      const flow = {
        scriptId: script.id,
        scriptTitle: script.topic ?? "",
        platform: script.platform ?? "",
        timestamp: now,
      };
      setActiveVideoFlow(flow);
      syncActiveFlowToLegacyStorage(flow, script.content ?? "");
      // Clear any previous avatar/video selection so flow starts fresh
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("selectedAvatar");
        sessionStorage.removeItem("selectedAvatarFull");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("selectedAvatar");
        localStorage.removeItem("selectedAvatarFull");
        localStorage.removeItem("videoSize");
      }
      router.push(`/dashboard/avatars?scriptId=${encodeURIComponent(script.id)}`);
    } catch {
      router.push(`/dashboard/avatars?scriptId=${encodeURIComponent(script.id)}`);
    }
  };

  const handleGenerateVideo = async (avatarIdOverride?: string, useDefaults?: boolean) => {
    if (!script) return;
    setGeneratingVideo(true);
    setVideoProgress('Starting video generation...');

    const effectiveAvatarId = avatarIdOverride ?? (hasCustomAvatar ? undefined : selectedAvatar);
    const effectiveAspectRatio = useDefaults ? '9:16' : selectedAspectRatio;

    let storedVoiceId: string | null = null;
    let storedAvatarName: string | null = null;
    let storedAvatarLook: string | null = null;
    try {
      const fromSession = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("selectedAvatarFull") : null;
      const fromLocal = typeof localStorage !== "undefined" ? localStorage.getItem("selectedAvatarFull") : null;
      const raw = fromSession ?? fromLocal;
      if (raw && raw.startsWith("{")) {
        const parsed = JSON.parse(raw) as { voice_id?: string; voice_name?: string; name?: string; selectedLook?: string };
        if (parsed?.voice_id) storedVoiceId = parsed.voice_id;
        if (parsed?.name) storedAvatarName = parsed.name;
        if (parsed?.selectedLook) storedAvatarLook = parsed.selectedLook;
      }
    } catch {
      // ignore
    }
    const effectiveVoiceId = storedVoiceId ?? (selectedVoice && selectedVoice !== "default" ? selectedVoice : undefined);

    try {
      setVideoProgress('Connecting to video service...');
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          avatarId: hasCustomAvatar ? undefined : effectiveAvatarId,
          ...(hasCustomAvatar && { useClonedVoice }),
          ...((!hasCustomAvatar || !useClonedVoice) && effectiveVoiceId && { voiceId: effectiveVoiceId }),
          ...(storedAvatarName && { avatarName: storedAvatarName }),
          ...(storedAvatarLook && { avatarLook: storedAvatarLook }),
          aspectRatio: effectiveAspectRatio,
          ...(useDefaults ? {} : {
            backgroundType: backgroundType === 'default' ? undefined : backgroundType,
            backgroundValue: backgroundType === 'color' ? backgroundColor : backgroundType === 'image' ? backgroundImageUrl : undefined,
            captionsEnabled,
            captionStyle: captionsEnabled ? captionStyle : undefined,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 && (data.code === "out_of_credits" || data.code === "trial_expired")) {
          setUpgradeModal({
            show: true,
            reason: data.code === "trial_expired" ? "trial" : "credits",
            creditsRemaining: data.creditsRemaining ?? 0,
          });
        } else if (response.status === 402) {
          toast.error(data.error || `Insufficient credits. Video generation costs ${data.creditsRequired ?? 5} credits.`);
        } else {
          toast.error(data.error || 'Failed to start video generation');
          if (data.creditsRefunded) {
            toast.info('Your credits have been refunded.');
          }
        }
        setGeneratingVideo(false);
        if (data.projectId) {
          router.push(`/dashboard/projects/${data.projectId}`);
        }
        return;
      }

      toast.success('Video generation started! Redirecting to project...');
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
      }
      if (data.projectId) {
        router.push(`/dashboard/projects/${data.projectId}`);
        setGeneratingVideo(false);
        return;
      }

      setVideoProgress('Processing... this may take 2 to 5 minutes.');
      const scriptIdForPoll = script?.id?.trim?.();
      if (!scriptIdForPoll) {
        toast.error('Invalid script; cannot poll status.');
        setGeneratingVideo(false);
        return;
      }

      const pollStatus = async () => {
        let attempts = 0;
        const maxAttempts = 180;
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;
          setVideoProgress(`Processing... (${attempts * 10}s elapsed)`);
          try {
            const statusResponse = await fetch(`/api/scripts/${scriptIdForPoll}/generate-video`);
            const statusData = await statusResponse.json();
            if (statusData.status === 'completed') {
              setScript(prev => prev ? { ...prev, generatedVideoUrl: statusData.videoUrl, videoStatus: 'completed', status: 'video_ready' } : null);
              toast.success('Video generated successfully!');
              setGeneratingVideo(false);
              setVideoProgress('');
              if (typeof window !== "undefined") {
                localStorage.setItem("dashboard-refresh", Date.now().toString());
                window.dispatchEvent(new CustomEvent("dashboard-refresh"));
                window.dispatchEvent(new Event("credits-updated"));
              }
              return;
            }
            if (statusData.status === 'failed') {
              toast.error(statusData.error || 'Video generation failed');
              setGeneratingVideo(false);
              setVideoProgress('');
              return;
            }
          } catch (error) {
            console.error('Status check failed:', error);
          }
        }
        toast.error('Video generation timed out. Please check back later.');
        setGeneratingVideo(false);
        setVideoProgress('');
      };
      pollStatus();

    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Failed to generate video');
      setGeneratingVideo(false);
      setVideoProgress('');
    }
  };

  const handleDownloadVideo = () => {
    if (script?.generatedVideoUrl) {
      window.open(script.generatedVideoUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading your script...</p>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Script not found</h2>
          <p className="text-gray-500 mb-4">This script may have been deleted</p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              {script.topic}
            </h1>
            <div className="flex items-center flex-wrap gap-2">
              <PlatformBadge platform={script.platform} />
              <ToneBadge tone={script.tone} />
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                {script.length}s
              </span>
              <span className="text-sm text-gray-400">
                {new Date(script.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Share Button */}
          <Button variant="secondary" size="md" leftIcon={<Share2 className="h-4 w-4" />}>
            Share
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Script Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" className="relative">
            {/* Edit Mode Toggle */}
            {editing ? (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setEditedContent(script.content);
                  }}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  loading={saving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save
                </Button>
              </div>
            ) : null}

            {/* Script Display */}
            {editing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[400px] p-4 text-lg leading-relaxed text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
              />
            ) : (
              <div
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatScriptContent(getDisplayScript(script.content) || script.content),
                }}
              />
            )}

            {/* Script Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {countWords(script.content)} words
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {calculateReadingTime(script.content)}
                </span>
              </div>
            </div>
          </Card>

          {/* Completed Video - show player + download */}
          {script.generatedVideoUrl && (
            <Card className="p-6 bg-green-50/50 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Your Video</h3>
              </div>
              <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px] mx-auto mb-4">
                <video
                  src={script.generatedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleDownloadVideo}
                leftIcon={<Download className="h-5 w-5" />}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Download Video
              </Button>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              className="flex-1 sm:flex-none"
            >
              {copied ? "Copied!" : "Copy Script"}
            </Button>

            {script.generatedVideoUrl ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleDownloadVideo}
                leftIcon={<Download className="h-5 w-5" />}
                className="flex-1 sm:flex-none bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Download Video
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleGenerateVideoClick}
                disabled={generatingVideo}
                leftIcon={generatingVideo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                className="flex-1 sm:flex-none"
              >
                {generatingVideo ? (videoProgress || 'Generating...') : 'Generate Video'}
                {!generatingVideo && (
                  <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">5 credits</span>
                )}
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                title="Edit script"
              >
                <Edit3 className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRegenerateModal(true)}
                disabled={regenerating}
                title="Regenerate script"
              >
                <RefreshCw className={cn("h-5 w-5", regenerating && "animate-spin")} />
              </Button>

              {/* Download Dropdown */}
              <div className="relative group">
                <Button variant="ghost" size="icon" title="Download">
                  <Download className="h-5 w-5" />
                </Button>
                <div className="absolute right-0 top-full mt-1 py-2 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleDownload("txt")}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 whitespace-nowrap"
                  >
                    Download as .txt
                  </button>
                  <button
                    onClick={() => handleDownload("md")}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 whitespace-nowrap"
                  >
                    Download as .md
                  </button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Delete script"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Research Badge */}
          <Card variant="default" className="border-l-4 border-l-violet-500 bg-violet-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Brain className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">AI Research Enhanced</p>
                <p className="text-xs text-gray-500">
                  Script created using competitor analysis
                </p>
              </div>
            </div>
          </Card>

          {/* Why This Script Works */}
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-gray-900">Why This Will Work</h3>
            </div>
            <ul className="space-y-3">
              {getScriptInsights(script).map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {insight}
                </li>
              ))}
            </ul>
          </Card>

          {/* What's Next */}
          <Card variant="default">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What's Next?
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGenerateVideoClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 hover:from-primary/10 hover:to-secondary/10 transition-colors text-left"
              >
                <span className="font-medium text-gray-900">Create video with this script</span>
                <ExternalLink className="h-4 w-4 text-primary" />
              </button>
              <button
                onClick={() => setShowRegenerateModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-medium text-gray-700">Generate a follow-up script</span>
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                <span className="font-medium text-gray-700">Create Instagram version</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </Card>

          {/* Script Info */}
          <Card variant="bordered">
            <h4 className="font-semibold text-gray-900 mb-3">Script Details</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(script.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Platform</dt>
                <dd className="text-gray-900">{script.platform}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tone</dt>
                <dd className="text-gray-900">{script.tone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Target Length</dt>
                <dd className="text-gray-900">{script.length} seconds</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Word Count</dt>
                <dd className="text-gray-900">{countWords(script.content)} words</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this script?"
        description="This action cannot be undone. The script will be permanently deleted."
        confirmText="Delete"
        cancelText="Keep Script"
        variant="danger"
        loading={deleting}
      />

      {/* Regenerate Confirmation Modal */}
      <ConfirmModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerate}
        title="Regenerate script?"
        description="This will use 1 credit to create a new version. Your current script will be kept."
        confirmText="Use 1 Credit"
        cancelText="Cancel"
        variant="warning"
        loading={regenerating}
      />

      {upgradeModal?.show && (
        <UpgradeModal
          onClose={() => setUpgradeModal(null)}
          reason={upgradeModal.reason}
          creditsRemaining={upgradeModal.creditsRemaining}
        />
      )}
    </div>
  );
}
