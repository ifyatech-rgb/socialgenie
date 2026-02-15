"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle,
  Scissors,
  Download,
  X,
  Search,
} from "lucide-react";
import { useCredits } from "@/app/dashboard/credits-context";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";

const PENDING_SCRIPT_KEY = "pendingScript";
const SELECTED_AVATAR_KEY = "selectedAvatarId";
const POLL_INTERVAL_MS = 5000;
const VIDEO_CREDITS = 5;
const AVATARS_PER_PAGE = 20;

type PendingScript = { scriptId?: string; script: string; topic: string; platform: string };
type AvatarItem = {
  id: string;
  name: string;
  preview?: string;
  gender?: string;
  style?: string;
  isPaid?: boolean;
  isPublic?: boolean;
  isCustom?: boolean;
  category?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
};
type VoiceItem = { id: string; name: string; gender?: string; accent?: string; preview?: string };
type ScriptListItem = { id: string; topic: string; platform: string; content: string };

export default function AvatarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const creditsFromContext = useCredits();
  const [pendingScript, setPendingScript] = useState<PendingScript | null>(null);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarItem | null>(null);
  const [browseSelectedAvatar, setBrowseSelectedAvatar] = useState<AvatarItem | null>(null);
  const [avatarVoices, setAvatarVoices] = useState<VoiceItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [defaultVoice, setDefaultVoice] = useState("");
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<"processing" | "completed" | "failed" | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState("");
  const [showFreeOnly, setShowFreeOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [avatarType, setAvatarType] = useState<"photo" | "video">("photo");
  const [avatarName, setAvatarName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<{
    avatarId: string;
    status: string;
    progress?: number;
    estimatedTime?: string;
  } | null>(null);
  const [looksModalFolder, setLooksModalFolder] = useState<{ baseName: string; looks: AvatarItem[] } | null>(null);
  const [scriptPickerForAvatar, setScriptPickerForAvatar] = useState<AvatarItem | null>(null);
  const [scriptsForPicker, setScriptsForPicker] = useState<ScriptListItem[]>([]);
  const [loadingScriptsForPicker, setLoadingScriptsForPicker] = useState(false);
  const [selectedScriptForPicker, setSelectedScriptForPicker] = useState<ScriptListItem | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [avatarPage, setAvatarPage] = useState(1);

  // Custom avatar creation wizard
  const [creationStep, setCreationStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{
    file: File;
    url: string;
    name: string;
    size: number;
    duration: string;
  } | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  // Live consent recording (video avatar step 3)
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [consentVideo, setConsentVideo] = useState<{ blob: Blob; url: string; durationSeconds: number } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimeRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Base name for grouping: "Abigail Office Front" → "Abigail", "Aditya in Brown blazer" → "Aditya" */
  const getAvatarBaseName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.includes(" in ")) return trimmed.split(" in ")[0].trim();
    const first = trimmed.split(/\s+/)[0];
    return first || trimmed;
  }, []);

  const loadPendingScript = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(PENDING_SCRIPT_KEY);
      if (!raw) {
        setPendingScript(null);
        return;
      }
      const data = JSON.parse(raw) as PendingScript;
      if (data?.script && data?.topic && data?.platform) setPendingScript(data);
      else setPendingScript(null);
    } catch {
      setPendingScript(null);
    }
  }, []);

  useEffect(() => {
    loadPendingScript();
  }, [loadPendingScript]);

  useEffect(() => {
    if (creationStep === 4 && avatarType === "video") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔍 STEP 4 DEBUG - VIDEO STATES");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Uploaded Video:", uploadedVideo);
      console.log("  - Has URL:", !!uploadedVideo?.url);
      console.log("  - Name:", uploadedVideo?.name);
      console.log("  - Duration:", uploadedVideo?.duration);
      console.log("  - Size:", uploadedVideo?.size);
      console.log("Consent Video:", consentVideo);
      console.log("  - Has URL:", !!consentVideo?.url);
      console.log("  - Blob size:", consentVideo?.blob?.size);
      console.log("Recording Time:", recordingTime);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
  }, [creationStep, avatarType, uploadedVideo, consentVideo, recordingTime]);

  useEffect(() => {
    const scriptId = searchParams?.get("script")?.trim();
    if (!scriptId || !session || pendingScript) return;
    let cancelled = false;
    authFetch(`/api/scripts/${scriptId}`, {}, session)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (cancelled || !d?.script) return;
        const s = d.script;
        if (!s?.id || !s?.content || !s?.topic || !s?.platform) return;
        const payload: PendingScript = { scriptId: s.id, script: s.content, topic: s.topic, platform: s.platform };
        sessionStorage.setItem(PENDING_SCRIPT_KEY, JSON.stringify(payload));
        setPendingScript(payload);
        window.history.replaceState({}, "", "/dashboard/avatars");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [searchParams, session, pendingScript]);

  useEffect(() => {
    if (!session) return;
    authFetch("/api/user", {}, session).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setCredits(d.user?.credits ?? 0);
      }
    });
  }, [session]);

  useEffect(() => {
    if (!scriptPickerForAvatar || !session) {
      setScriptsForPicker([]);
      return;
    }
    setLoadingScriptsForPicker(true);
    authFetch("/api/scripts", {}, session)
      .then(async (r) => {
        const d = await r.json();
        if (d.scripts && Array.isArray(d.scripts)) {
          setScriptsForPicker(
            d.scripts.map((s: { id: string; topic: string; platform: string; content: string }) => ({
              id: s.id,
              topic: s.topic ?? "Untitled",
              platform: s.platform ?? "",
              content: s.content ?? "",
            }))
          );
        } else {
          setScriptsForPicker([]);
        }
      })
      .catch(() => setScriptsForPicker([]))
      .finally(() => setLoadingScriptsForPicker(false));
  }, [scriptPickerForAvatar, session]);

  const loadAvatars = useCallback(async () => {
    if (!session) return;
    setLoadingAvatars(true);
    setError("");
    try {
      const url = showFreeOnly ? "/api/heygen/avatars?free=true" : "/api/heygen/avatars?all=true";
      const res = await authFetch(url, {}, session);
      const d = await res.json();
      if (d.success && Array.isArray(d.avatars)) {
        setAvatars(d.avatars);
      } else {
        setError(d.message ?? "Failed to load avatars");
        setAvatars([]);
      }
    } catch (e) {
      setError(String(e));
      setAvatars([]);
    } finally {
      setLoadingAvatars(false);
    }
  }, [session, showFreeOnly]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const handleAvatarSelect = useCallback(
    async (avatar: AvatarItem) => {
      setSelectedAvatar(avatar);
      setBrowseSelectedAvatar(avatar);
      setLoadingVoices(true);
      setAvatarVoices([]);
      setSelectedVoice("");
      try {
        const res = await authFetch(`/api/heygen/avatar-voices?avatarId=${encodeURIComponent(avatar.id)}`, {}, session!);
        const data = await res.json();
        if (data.success) {
          setAvatarVoices(data.voices ?? []);
          setDefaultVoice(data.defaultVoice ?? "");
          setSelectedVoice(data.defaultVoice || data.voices?.[0]?.id || "");
        }
      } catch {
        toast.error("Failed to load voices");
      } finally {
        setLoadingVoices(false);
      }
    },
    [session]
  );

  // Pre-select avatar from sessionStorage when arriving with pending script
  useEffect(() => {
    if (!pendingScript || avatars.length === 0 || selectedAvatar) return;
    try {
      const saved = sessionStorage.getItem(SELECTED_AVATAR_KEY);
      if (!saved) return;
      const avatar = avatars.find((a) => a.id === saved);
      if (avatar) handleAvatarSelect(avatar);
    } catch {}
  }, [pendingScript, avatars, selectedAvatar, handleAvatarSelect]);

  useEffect(() => {
    if (!videoId || !session || videoStatus === "completed" || videoStatus === "failed") return;
    const interval = setInterval(async () => {
      try {
        const res = await authFetch(`/api/heygen/status?videoId=${videoId}`, {}, session);
        const data = await res.json();
        if (data.status === "completed") {
          setVideoStatus("completed");
          setVideoUrl(data.video_url ?? null);
          setThumbnailUrl(data.thumbnail_url ?? null);
          setVideoError(null);
          setIsGenerating(false);
          authFetch("/api/user", {}, session).then(async (r) => {
            if (r.ok) {
              const u = await r.json();
              setCredits(u.user?.credits ?? 0);
            }
            if (typeof window !== "undefined") {
              localStorage.setItem("dashboard-refresh", Date.now().toString());
              window.dispatchEvent(new CustomEvent("dashboard-refresh"));
            }
          });
        } else if (data.status === "failed") {
          setVideoStatus("failed");
          setVideoError(data.error ?? "Generation failed");
          setIsGenerating(false);
        }
      } catch {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [videoId, session, videoStatus]);

  const handleGenerateVideo = async () => {
    if (!pendingScript || !selectedAvatar || !selectedVoice || !session) {
      toast.error("Please select an avatar and voice");
      return;
    }
    const effectiveCredits = creditsFromContext ?? credits;
    if (effectiveCredits !== null && effectiveCredits < VIDEO_CREDITS) {
      toast.error(`Need ${VIDEO_CREDITS} credits`);
      return;
    }
    setIsGenerating(true);
    setVideoStatus(null);
    setVideoUrl(null);
    setVideoError(null);
    try {
      const res = await authFetch(
        "/api/heygen/generate",
        {
          method: "POST",
          body: JSON.stringify({
            script: pendingScript.script,
            avatarId: selectedAvatar.id,
            voiceId: selectedVoice,
            platform: pendingScript.platform,
            scriptId: pendingScript.scriptId,
            aspectRatio: videoAspectRatio,
          }),
        },
        session
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? data.error ?? "Failed");
        setIsGenerating(false);
        return;
      }
      setVideoId(data.videoId ?? null);
      setVideoStatus("processing");
      setCredits(data.remainingCredits ?? effectiveCredits);
      toast.success("Video generation started (2–5 min)");
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-refresh", Date.now().toString());
        window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      }
    } catch (e) {
      toast.error(String(e));
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `video-${Date.now()}.mp4`;
      a.target = "_blank";
      a.click();
    }
  };

  const handleClearAndBack = () => {
    sessionStorage.removeItem(PENDING_SCRIPT_KEY);
    router.push("/dashboard/scripts");
  };

  const handleUseAvatar = (avatar: AvatarItem) => {
    setScriptPickerForAvatar(avatar);
    setSelectedScriptForPicker(null);
  };

  const handleConfirmScriptForAvatar = () => {
    if (!scriptPickerForAvatar || !selectedScriptForPicker || !session) return;
    const payload: PendingScript = {
      scriptId: selectedScriptForPicker.id,
      script: selectedScriptForPicker.content,
      topic: selectedScriptForPicker.topic,
      platform: selectedScriptForPicker.platform,
    };
    sessionStorage.setItem(PENDING_SCRIPT_KEY, JSON.stringify(payload));
    setPendingScript(payload);
    setSelectedAvatar(scriptPickerForAvatar);
    setBrowseSelectedAvatar(null);
    setScriptPickerForAvatar(null);
    setSelectedScriptForPicker(null);
    // Load voices for the selected avatar so video gen step is ready
    setLoadingVoices(true);
    setAvatarVoices([]);
    setSelectedVoice("");
    authFetch(`/api/heygen/avatar-voices?avatarId=${encodeURIComponent(scriptPickerForAvatar.id)}`, {}, session)
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          setAvatarVoices(data.voices ?? []);
          setDefaultVoice(data.defaultVoice ?? "");
          setSelectedVoice(data.defaultVoice || data.voices?.[0]?.id || "");
        }
      })
      .catch(() => toast.error("Failed to load voices"))
      .finally(() => setLoadingVoices(false));
    toast.success(`Using "${selectedScriptForPicker.topic}" with ${scriptPickerForAvatar.name}. Select a voice and generate.`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarType === "photo") {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
    } else {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file (MP4, MOV)");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video must be less than 100MB");
        return;
      }
    }
    setSelectedFile(file);
  };

  const pollAvatarStatus = useCallback(
    (avatarId: string) => {
      if (!session) return;
      const checkStatus = async () => {
        try {
          const res = await authFetch(`/api/heygen/avatar-status?avatarId=${encodeURIComponent(avatarId)}`, {}, session);
          const data = await res.json();
          if (!data.success) return;
          setCreationProgress((prev) =>
            prev?.avatarId === avatarId
              ? { ...prev, avatarId, status: data.status, progress: data.progress }
              : prev
          );
          if (data.status === "completed") {
            toast.success("Your custom avatar is ready!");
            loadAvatars();
            setCreationProgress(null);
          } else if (data.status === "failed") {
            toast.error("Avatar creation failed. Please try again.");
            setCreationProgress(null);
          } else {
            setTimeout(checkStatus, 30000);
          }
        } catch {
          setTimeout(checkStatus, 30000);
        }
      };
      checkStatus();
    },
    [session, loadAvatars]
  );

  const handleCreateAvatar = async () => {
    if (!avatarName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (avatarType === "photo") {
      if (!selectedFile) {
        toast.error("Please upload a photo");
        return;
      }
      if (!consentGiven) {
        toast.error("Please agree to the consent statement");
        return;
      }
    }
    if (avatarType === "video") {
      if (!uploadedVideo) {
        toast.error("Please upload your video");
        return;
      }
      if (!consentVideo) {
        toast.error("Please record the live consent video");
        return;
      }
    }
    if (!session) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("avatarName", avatarName.trim());
      formData.append("avatarType", avatarType);
      if (avatarType === "photo" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (avatarType === "video" && uploadedVideo) {
        formData.append("file", uploadedVideo.file, uploadedVideo.name);
        if (consentVideo) formData.append("consentVideo", consentVideo.blob, "consent-video.webm");
      }

      const res = await authFetch("/api/heygen/create-avatar", { method: "POST", body: formData }, session);
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (text.trim().length > 0 && !text.trimStart().startsWith("<")) {
          data = JSON.parse(text) as Record<string, unknown>;
        }
      } catch {
        data = { error: "InvalidResponse", message: "Server returned an invalid response. Please try again." };
      }

      if (!res.ok) {
        throw new Error((data?.message as string) ?? (data?.error as string) ?? "Failed to create avatar");
      }
      if (!data.success) {
        throw new Error((data?.message as string) ?? (data?.error as string) ?? "Failed to create avatar");
      }

      const avatarId = typeof data.avatarId === "string" ? data.avatarId : String(data.avatarId ?? "");
      if (!avatarId) throw new Error("No avatar ID returned");

      const timeEstimate = avatarType === "photo" ? "5-15 minutes" : "15-30 minutes";
      setCreationProgress({
        avatarId,
        status: "processing",
        estimatedTime: timeEstimate,
      });
      setShowCreateModal(false);
      resetCreationForm();
      pollAvatarStatus(avatarId);
      toast.success(`Avatar creation started! Your avatar will be ready in ${timeEstimate}. We'll notify you when it's complete.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create avatar");
    } finally {
      setCreating(false);
    }
  };

  function resetCreationForm() {
    setCreationStep(1);
    setAvatarType("photo");
    setUploadedPhoto(null);
    setUploadedVideo((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setSelectedFile(null);
    setAvatarName("");
    setConsentGiven(false);
    if (consentVideo?.url) URL.revokeObjectURL(consentVideo.url);
    setConsentVideo(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    recordedChunksRef.current = [];
    stopConsentCamera();
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid video file (MP4, MOV, AVI)");
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("Video file must be less than 500MB");
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = function () {
      URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);

      if (duration < 120) {
        toast.error(
          `Video must be at least 2 minutes long. Your video is ${Math.floor(duration / 60)} minute(s).`
        );
        URL.revokeObjectURL(url);
        return;
      }

      if (duration > 300) {
        toast.error(
          `Video must be 5 minutes or less. Your video is ${Math.floor(duration / 60)} minutes. Please trim it.`
        );
        URL.revokeObjectURL(url);
        return;
      }

      setUploadedVideo({
        file,
        url,
        name: file.name,
        size: file.size,
        duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")} min`,
      });
    };
    video.src = url;
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const startConsentRecording = useCallback(async () => {
    if (!avatarName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error("Could not access camera. Please check permissions.");
    }
  }, [avatarName]);

  const stopConsentCamera = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startConsentRecordingCapture = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    try {
      const options = { mimeType: "video/webm;codecs=vp9" };
      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        const durationSeconds = recordingTimeRef.current;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: "video/webm" });
          setConsentVideo({ blob, url: URL.createObjectURL(blob), durationSeconds });
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          if (next >= 60) stopConsentRecording();
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Could not start recording. Please try again.");
    }
  }, []);

  function stopConsentRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  const retakeConsentVideo = useCallback(() => {
    if (consentVideo?.url) URL.revokeObjectURL(consentVideo.url);
    setConsentVideo(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    recordedChunksRef.current = [];
  }, [consentVideo]);

  const proceedToSubmit = useCallback(() => {
    stopConsentCamera();
    setCreationStep(4);
  }, [stopConsentCamera]);

  const effectiveCredits = creditsFromContext ?? credits;
  const canGenerate = !!selectedAvatar && !!selectedVoice && effectiveCredits !== null && effectiveCredits >= VIDEO_CREDITS;

  const filteredAvatars = useMemo(() => {
    return avatars.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = genderFilter === "all" || (a.gender?.toLowerCase() ?? "") === genderFilter.toLowerCase();
      return matchesSearch && matchesGender;
    });
  }, [avatars, searchQuery, genderFilter]);

  /** Group avatars by base name for folder display (same avatar, multiple looks). Always use this for consistent organized view. */
  const avatarGroups = useMemo(() => {
    const map = new Map<string, AvatarItem[]>();
    for (const a of filteredAvatars) {
      const base = getAvatarBaseName(a.name);
      if (!map.has(base)) map.set(base, []);
      map.get(base)!.push(a);
    }
    return Array.from(map.entries())
      .map(([baseName, looks]) => ({ baseName, looks: looks.sort((x, y) => x.name.localeCompare(y.name)) }))
      .sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [filteredAvatars, getAvatarBaseName]);

  const totalAvatarPages = Math.max(1, Math.ceil(avatarGroups.length / AVATARS_PER_PAGE));
  const paginatedAvatarGroups = useMemo(() => {
    const start = (avatarPage - 1) * AVATARS_PER_PAGE;
    return avatarGroups.slice(start, start + AVATARS_PER_PAGE);
  }, [avatarGroups, avatarPage]);

  useEffect(() => {
    setAvatarPage(1);
  }, [searchQuery, genderFilter]);

  if (!session) return <div className="flex min-h-[200px] items-center justify-center text-gray-500">Loading...</div>;

  // ─── BROWSE MODE: No pending script ───
  if (!pendingScript) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Avatars</h1>
            <p className="mt-1 text-gray-500">Browse avatars and pick one for your video</p>
          </div>
        </div>

        {/* Create Your Avatar Card */}
        <div className="create-avatar-card mb-8">
          <div className="create-card-content">
            <div className="create-card-left">
              <div className="create-badge">
                <span className="badge-icon">✨</span>
                <span>Custom Avatar</span>
              </div>
              <h2 className="create-title">Create Your Own AI Avatar</h2>
              <p className="create-description">
                Upload your photo or record a short video to create a personalized AI avatar
                that speaks in any language. Ready in 5-30 minutes depending on type.
              </p>
              <div className="create-features">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Speaks 40+ languages</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Realistic expressions</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Unlimited videos</span>
                </div>
              </div>
              <button
                type="button"
                className="create-avatar-btn"
                onClick={() => router.push("/dashboard/avatars/create")}
              >
                <span className="btn-icon">🎭</span>
                <span>Create Your Avatar</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="create-card-right">
              <div className="avatar-preview-animation">
                <div className="preview-circle" />
                <div className="preview-circle delay-1" />
                <div className="preview-circle delay-2" />
                <div className="avatar-icon">🎭</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search avatars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-700"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <span className="text-amber-800">{error}</span>
            <button onClick={loadAvatars} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700">
              Retry
            </button>
          </div>
        )}

        {loadingAvatars && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {!loadingAvatars && !error && avatarGroups.length === 0 && (
          <div className="py-20 text-center">
            <span className="text-6xl opacity-40">No avatars found</span>
            <p className="mt-4 text-gray-600">Try adjusting your filters</p>
          </div>
        )}

        {!loadingAvatars && !error && avatarGroups.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {paginatedAvatarGroups.map(({ baseName, looks }) => {
                const first = looks[0];
                const isSelected = browseSelectedAvatar && looks.some((l) => l.id === browseSelectedAvatar.id);
                const lookCount = looks.length;
                return (
                  <div
                    key={baseName + first.id}
                    onClick={() =>
                      lookCount === 1
                        ? setBrowseSelectedAvatar(first)
                        : setLooksModalFolder({ baseName, looks })
                    }
                    className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white transition-all hover:-translate-y-1 hover:shadow-xl ${
                      isSelected ? "border-violet-500 ring-2 ring-violet-500/30" : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className="aspect-[3/4] w-full bg-gray-100">
                      {first.preview ? (
                        <img
                          src={first.preview}
                          alt={baseName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => ((e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23f0f0f0' width='300' height='400'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E")}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl text-gray-400">👤</div>
                      )}
                      {first.isCustom && (
                        <div className="absolute left-2 top-2 rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">Custom</div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 p-3">
                      <div className="truncate font-semibold text-gray-900">{baseName}</div>
                      <div className="mt-0.5 text-sm text-gray-500">
                        {lookCount === 1 ? "1 look" : `${lookCount} looks`}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white shadow-lg">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
            {avatarGroups.length > AVATARS_PER_PAGE && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setAvatarPage((p) => Math.max(1, p - 1))}
                  disabled={avatarPage <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {avatarPage} of {totalAvatarPages}
                </span>
                <button
                  type="button"
                  onClick={() => setAvatarPage((p) => Math.min(totalAvatarPages, p + 1))}
                  disabled={avatarPage >= totalAvatarPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Looks picker modal: choose one look from an avatar folder */}
        {looksModalFolder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setLooksModalFolder(null)}
          >
            <div
              className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {looksModalFolder.baseName} – Choose a look
                </h2>
                <button
                  type="button"
                  onClick={() => setLooksModalFolder(null)}
                  className="rounded-full p-2 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {looksModalFolder.looks.map((look, index) => (
                    <button
                      key={`${look.id}-${index}`}
                      type="button"
                      onClick={() => {
                        if (pendingScript) {
                          handleAvatarSelect(look);
                          setLooksModalFolder(null);
                        } else {
                          setBrowseSelectedAvatar(look);
                          setLooksModalFolder(null);
                        }
                      }}
                      className="flex flex-col overflow-hidden rounded-xl border-2 border-gray-200 bg-white text-left transition hover:border-violet-400 hover:shadow-md"
                    >
                      <div className="aspect-[3/4] w-full bg-gray-100">
                        {look.preview ? (
                          <img
                            src={look.preview}
                            alt={look.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => ((e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23f0f0f0' width='300' height='400'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E")}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-gray-400">👤</div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <div className="truncate text-sm font-medium text-gray-900">{look.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Script picker modal: choose a script to use with the selected avatar */}
        {scriptPickerForAvatar && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setScriptPickerForAvatar(null)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-violet-200/50 bg-white shadow-2xl ring-4 ring-violet-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {scriptPickerForAvatar.preview && (
                      <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-violet-200">
                        <img src={scriptPickerForAvatar.preview} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Choose a script</h2>
                      <p className="text-sm text-gray-600">Use with <span className="font-semibold text-violet-700">{scriptPickerForAvatar.name}</span></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScriptPickerForAvatar(null)}
                    className="rounded-full p-2 text-gray-500 hover:bg-white/80 hover:text-gray-900"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingScriptsForPicker ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                    <p className="mt-3 text-sm font-medium text-gray-600">Loading your scripts...</p>
                  </div>
                ) : scriptsForPicker.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500" />
                    <p className="mt-3 font-medium text-gray-900">No scripts yet</p>
                    <p className="mt-1 text-sm text-gray-500">Create a script first, then come back to make a video with this avatar.</p>
                    <Link href="/dashboard/scripts" className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">
                      Go to Scripts
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scriptsForPicker.map((script) => {
                      const isSelected = selectedScriptForPicker?.id === script.id;
                      return (
                        <button
                          key={script.id}
                          type="button"
                          onClick={() => setSelectedScriptForPicker(script)}
                          className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/30"
                              : "border-gray-200 bg-gray-50/80 hover:border-violet-300 hover:bg-violet-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900">{script.topic}</div>
                              {script.platform && (
                                <span className="mt-1 inline-block rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                  {script.platform}
                                </span>
                              )}
                              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                {script.content.replace(/\s+/g, " ").trim().slice(0, 120)}
                                {script.content.length > 120 ? "…" : ""}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {scriptsForPicker.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50/80 px-5 py-4">
                  <button
                    type="button"
                    onClick={handleConfirmScriptForAvatar}
                    disabled={!selectedScriptForPicker}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-bold text-white shadow-lg transition hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:hover:from-violet-600 disabled:hover:to-purple-600"
                  >
                    Confirm & make video
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Avatar Creation Modal - 3-step wizard */}
        {showCreateModal && (
          <div
            className="avatar-modal-overlay"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {creationStep === 1 && "🎭 Create Your Avatar"}
                  {creationStep === 2 && avatarType === "photo" && "📸 Upload Photo"}
                  {creationStep === 2 && avatarType === "video" && "🎥 Upload Your Video"}
                  {creationStep === 3 && avatarType === "video" && "📹 Record Live Consent"}
                  {creationStep === 3 && avatarType === "photo" && "✅ Consent"}
                  {creationStep === 4 && "🎉 Submit"}
                </h2>
                <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)} aria-label="Close">
                  ✕
                </button>
              </div>

              <div className="creation-progress">
                <div className={`progress-step ${creationStep >= 1 ? "active" : ""} ${creationStep > 1 ? "completed" : ""}`}>
                  <div className="step-circle">1</div>
                  <span className="step-label">Choose Type</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${creationStep >= 2 ? "active" : ""} ${creationStep > 2 ? "completed" : ""}`}>
                  <div className="step-circle">2</div>
                  <span className="step-label">Upload</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${creationStep >= 3 ? "active" : ""} ${creationStep > 3 ? "completed" : ""}`}>
                  <div className="step-circle">3</div>
                  <span className="step-label">Live Consent</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${creationStep >= 4 ? "active" : ""}`}>
                  <div className="step-circle">4</div>
                  <span className="step-label">Submit</span>
                </div>
              </div>

              <div className="modal-body">
                {/* STEP 1: Choose type */}
                {creationStep === 1 && (
                  <div className="step-content">
                    <p className="step-description">
                      Choose how you want to create your avatar. Both types create realistic AI avatars that speak in any language.
                    </p>
                    <div className="avatar-type-grid">
                      <div
                        role="button"
                        tabIndex={0}
                        className={`type-option ${avatarType === "photo" ? "selected" : ""}`}
                        onClick={() => setAvatarType("photo")}
                        onKeyDown={(e) => e.key === "Enter" && setAvatarType("photo")}
                      >
                        <div className="type-icon">📸</div>
                        <h3>Photo Avatar</h3>
                        <p className="type-description">Create from a single photo</p>
                        <ul className="type-features">
                          <li>✓ Quick setup (2 minutes)</li>
                          <li>✓ Ready in 5-15 minutes</li>
                          <li>✓ High quality output</li>
                          <li>✓ Speaks 40+ languages</li>
                          <li>✓ Natural voice sync</li>
                        </ul>
                        {avatarType === "photo" && <div className="selected-badge">✓ Selected</div>}
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        className={`type-option ${avatarType === "video" ? "selected" : ""}`}
                        onClick={() => setAvatarType("video")}
                        onKeyDown={(e) => e.key === "Enter" && setAvatarType("video")}
                      >
                        <div className="type-icon premium">🎥</div>
                        <h3>Video Avatar</h3>
                        <p className="type-description">Create from a video recording</p>
                        <ul className="type-features">
                          <li>✓ Most realistic option</li>
                          <li>✓ Ready in 15-30 minutes</li>
                          <li>✓ Ultra HD quality</li>
                          <li>✓ Perfect lip-sync</li>
                          <li>✓ Natural movements</li>
                        </ul>
                        <div className="premium-badge">⭐ Best Quality</div>
                        {avatarType === "video" && <div className="selected-badge">✓ Selected</div>}
                      </div>
                    </div>
                    <div className="info-note">
                      <span className="note-icon">💡</span>
                      <span>Both avatar types are permanent and can be used in unlimited videos</span>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-primary" onClick={() => setCreationStep(2)}>
                        Continue <span className="btn-arrow">→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2a: Upload photo - detailed instructions */}
                {creationStep === 2 && avatarType === "photo" && !uploadedPhoto && (
                  <div className="step-content">
                    <div className="upload-instructions-header">
                      <h3>📸 Upload Your Photo</h3>
                      <p>Upload a high-quality photo that meets all the requirements below for best results.</p>
                    </div>
                    <div className="upload-section">
                      <div className="requirements-grid">
                        <div className="requirement-card important">
                          <div className="req-icon">📷</div>
                          <h4>Photo Quality</h4>
                          <ul>
                            <li>High resolution (minimum 1080px)</li>
                            <li>Clear and sharp image</li>
                            <li>No blur or pixelation</li>
                            <li>JPG or PNG format</li>
                            <li>Maximum file size: 10MB</li>
                          </ul>
                        </div>
                        <div className="requirement-card important">
                          <div className="req-icon">👤</div>
                          <h4>Face &amp; Positioning</h4>
                          <ul>
                            <li>Front-facing, looking at camera</li>
                            <li>Face clearly visible and centered</li>
                            <li>Neutral or friendly expression</li>
                            <li>No sunglasses or face coverings</li>
                            <li>Hair not covering face</li>
                          </ul>
                        </div>
                        <div className="requirement-card">
                          <div className="req-icon">💡</div>
                          <h4>Lighting</h4>
                          <ul>
                            <li>Well-lit, natural lighting preferred</li>
                            <li>Face evenly illuminated</li>
                            <li>No harsh shadows on face</li>
                            <li>Avoid direct overhead lighting</li>
                            <li>No backlight (light behind you)</li>
                          </ul>
                        </div>
                        <div className="requirement-card">
                          <div className="req-icon">🎨</div>
                          <h4>Background</h4>
                          <ul>
                            <li>Clean, professional background</li>
                            <li>Solid color or neutral setting</li>
                            <li>No distracting objects</li>
                            <li>Office or home setting works well</li>
                            <li>Avoid busy patterns</li>
                          </ul>
                        </div>
                      </div>
                      <div className="upload-zone-container">
                        <div className="upload-zone">
                          <input
                            type="file"
                            id="photo-upload"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <label htmlFor="photo-upload" className="upload-label">
                            <div className="upload-icon">📤</div>
                            <h3>Click to Upload Photo</h3>
                            <p>or drag and drop your photo here</p>
                            <div className="upload-specs">
                              <span className="spec-badge">JPG or PNG</span>
                              <span className="spec-badge">Max 10MB</span>
                              <span className="spec-badge">Min 1080px</span>
                            </div>
                          </label>
                        </div>
                        <div className="pro-tips">
                          <h4>💡 Pro Tips for Best Results:</h4>
                          <div className="tips-list">
                            <div className="tip-item">✓ Take photo during daytime near a window</div>
                            <div className="tip-item">✓ Wear professional or casual clothing</div>
                            <div className="tip-item">✓ Keep shoulders in frame</div>
                            <div className="tip-item">✓ Smile naturally or keep neutral expression</div>
                          </div>
                        </div>
                      </div>
                      <div className="time-estimate">
                        <span className="estimate-icon">⏱️</span>
                        <span>Processing time: <strong>5-15 minutes</strong> after upload</span>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(1)}>
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2a-done: Photo uploaded - continue to step 3 consent */}
                {creationStep === 2 && avatarType === "photo" && uploadedPhoto && (
                  <div className="step-content">
                    <div className="upload-success-section">
                      <div className="success-icon">✅</div>
                      <h3>Photo Uploaded Successfully!</h3>
                      <div className="preview-section">
                        <img src={uploadedPhoto} alt="Preview" className="photo-preview" />
                        <button
                          type="button"
                          className="btn-secondary small"
                          onClick={() => {
                            setUploadedPhoto(null);
                            setSelectedFile(null);
                          }}
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(1)}>
                        ← Back
                      </button>
                      <button type="button" className="btn-primary" onClick={() => setCreationStep(3)}>
                        Continue to Consent <span className="btn-arrow">→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Consent for photo (checkbox) */}
                {creationStep === 3 && avatarType === "photo" && (
                  <div className="step-content">
                    <div className="consent-section">
                      <h3>✅ Photo Uploaded Successfully</h3>
                      <div className="preview-section">
                        <img src={uploadedPhoto ?? undefined} alt="Preview" className="photo-preview" />
                      </div>
                      <div className="name-input-section">
                        <label htmlFor="avatar-name-photo">Your Full Name</label>
                        <input
                          id="avatar-name-photo"
                          type="text"
                          placeholder="Enter your full name"
                          value={avatarName}
                          onChange={(e) => setAvatarName(e.target.value)}
                          className="avatar-name-input"
                        />
                      </div>
                      <div className="consent-box">
                        <h4>📜 Consent Required</h4>
                        <div className="consent-text">
                          <p>I, <strong>{avatarName || "[Your Name]"}</strong>, consent to the creation of my AI avatar by SocialGenie.</p>
                          <p>I understand that this avatar will be used to generate videos and content on my behalf.</p>
                          <p>I confirm that I am the person in this photo and I authorize the use of my likeness for avatar creation.</p>
                          <p>This consent is given freely and can be revoked at any time.</p>
                        </div>
                        <label className="consent-checkbox">
                          <input
                            type="checkbox"
                            checked={consentGiven}
                            onChange={(e) => setConsentGiven(e.target.checked)}
                          />
                          <span className="checkbox-label">I have read and agree to the consent statement above</span>
                        </label>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(2)}>
                        ← Back
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleCreateAvatar}
                        disabled={!consentGiven || !avatarName.trim() || creating}
                      >
                        {creating ? (
                          <>
                            <span className="spinner" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Create Photo Avatar
                            <span className="btn-icon">🎭</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2b: Upload video file (no camera) */}
                {creationStep === 2 && avatarType === "video" && !uploadedVideo && (
                  <div className="step-content">
                    <div className="upload-instructions-header">
                      <h3>🎥 Upload Your Video</h3>
                      <p>Upload a pre-recorded video that meets all the requirements below. This will create the most realistic avatar possible.</p>
                    </div>
                    <div className="video-requirements-section">
                      <div className="critical-requirements">
                        <h4>⚠️ Critical Requirements (Must Follow):</h4>
                        <div className="critical-grid">
                          <div className="critical-item">
                            <span className="critical-icon">⏱️</span>
                            <strong>Video Duration</strong>
                            <p>2-5 minutes of footage required</p>
                          </div>
                          <div className="critical-item">
                            <span className="critical-icon">🎤</span>
                            <strong>Clear Voice</strong>
                            <p>Speak naturally and clearly throughout</p>
                          </div>
                          <div className="critical-item">
                            <span className="critical-icon">👁️</span>
                            <strong>Eye Contact</strong>
                            <p>Look directly at camera while speaking</p>
                          </div>
                          <div className="critical-item">
                            <span className="critical-icon">🔇</span>
                            <strong>Quiet Environment</strong>
                            <p>No background noise or music</p>
                          </div>
                        </div>
                      </div>
                      <div className="requirements-grid">
                        <div className="requirement-card important">
                          <div className="req-icon">🎬</div>
                          <h4>Video Quality</h4>
                          <ul>
                            <li><strong>Duration:</strong> 2-5 minutes (minimum 2 min)</li>
                            <li><strong>Resolution:</strong> 1080p or higher (HD)</li>
                            <li>Stable camera (no shaking)</li>
                            <li>Clear, sharp footage</li>
                            <li>MP4 or MOV format</li>
                          </ul>
                        </div>
                        <div className="requirement-card important">
                          <div className="req-icon">🎤</div>
                          <h4>Audio &amp; Voice</h4>
                          <ul>
                            <li><strong>Clear speech:</strong> Speak naturally and clearly</li>
                            <li><strong>Volume:</strong> Consistent, audible volume</li>
                            <li>No background noise or music</li>
                            <li>No echo or reverb</li>
                            <li>Natural speaking pace</li>
                          </ul>
                        </div>
                        <div className="requirement-card important">
                          <div className="req-icon">💡</div>
                          <h4>Lighting Requirements</h4>
                          <ul>
                            <li><strong>Good lighting:</strong> Face clearly visible</li>
                            <li>Natural daylight is best</li>
                            <li>Face evenly lit (no harsh shadows)</li>
                            <li>Avoid backlight (light behind you)</li>
                            <li>Use soft, diffused lighting</li>
                          </ul>
                        </div>
                        <div className="requirement-card important">
                          <div className="req-icon">🎨</div>
                          <h4>Background &amp; Setting</h4>
                          <ul>
                            <li><strong>Professional background:</strong> Clean, tidy</li>
                            <li>Solid color or office/home setting</li>
                            <li>No distracting objects or movement</li>
                            <li>Avoid busy patterns or clutter</li>
                            <li>Indoor setting preferred</li>
                          </ul>
                        </div>
                      </div>
                      <div className="what-to-say-section">
                        <h4>💬 What Should I Say in the Video?</h4>
                        <div className="say-options">
                          <div className="say-option">
                            <strong>Option 1: Introduction</strong>
                            <p>Introduce yourself, talk about your work, interests, or what you do. Speak naturally for 2-5 minutes.</p>
                            <span className="example">&quot;Hi, I&apos;m [Name]. I work as a [job] and I&apos;m passionate about...&quot;</span>
                          </div>
                          <div className="say-option">
                            <strong>Option 2: Read Content</strong>
                            <p>Read from a script, article, or any text content. This helps capture your voice patterns.</p>
                            <span className="example">Read a blog post, news article, or prepared script</span>
                          </div>
                          <div className="say-option">
                            <strong>Option 3: Tell a Story</strong>
                            <p>Share a story, experience, or explain something you&apos;re knowledgeable about.</p>
                            <span className="example">Share a recent experience or explain your expertise</span>
                          </div>
                        </div>
                      </div>
                      <div className="upload-zone-container">
                        <div className="upload-zone">
                          <input
                            type="file"
                            id="video-upload"
                            accept="video/mp4,video/quicktime,video/x-msvideo"
                            onChange={handleVideoUpload}
                            className="hidden"
                          />
                          <label htmlFor="video-upload" className="upload-label">
                            <div className="upload-icon">📤</div>
                            <h3>Click to Upload Video</h3>
                            <p>or drag and drop your video here</p>
                            <div className="upload-specs">
                              <span className="spec-badge">MP4 or MOV</span>
                              <span className="spec-badge">2-5 minutes</span>
                              <span className="spec-badge">Max 500MB</span>
                            </div>
                          </label>
                        </div>
                        <div className="pro-tips">
                          <h4>💡 How to Record Your Video:</h4>
                          <div className="tips-list">
                            <div className="tip-item">✓ Use your phone or webcam to record</div>
                            <div className="tip-item">✓ Record in a quiet room with good lighting</div>
                            <div className="tip-item">✓ Speak clearly for the full 2-5 minutes</div>
                            <div className="tip-item">✓ Save the video then upload it here</div>
                          </div>
                        </div>
                      </div>
                      <div className="time-estimate">
                        <span className="estimate-icon">⏱️</span>
                        <span>Processing time: <strong>15-30 minutes</strong> after upload</span>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(1)}>
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Video uploaded - go to Step 3 for live consent */}
                {creationStep === 2 && avatarType === "video" && uploadedVideo && (
                  <div className="step-content">
                    <div className="upload-success-section">
                      <div className="success-icon">✅</div>
                      <h3>Video Uploaded Successfully!</h3>
                      <div className="preview-section">
                        <video src={uploadedVideo.url} controls className="video-preview" />
                        <div className="video-info">
                          <span className="info-badge">📹 {uploadedVideo.name}</span>
                          <span className="info-badge">📊 {(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="info-badge">⏱️ {uploadedVideo.duration}</span>
                        </div>
                      </div>
                      <div className="next-step-info">
                        <h4>📹 Next Step: Live Consent Recording</h4>
                        <p>To create your video avatar, we need you to record a live consent statement on camera.</p>
                        <div className="consent-preview-box">
                          <h5>What you&apos;ll do:</h5>
                          <ul>
                            <li>✓ Your camera will open</li>
                            <li>✓ You&apos;ll see a consent script on screen</li>
                            <li>✓ Read the script clearly (30-60 seconds)</li>
                            <li>✓ This confirms your identity and consent</li>
                          </ul>
                        </div>
                        <div className="important-note">
                          <span className="note-icon">⚠️</span>
                          <span>This is required for security and identity verification</span>
                        </div>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          if (uploadedVideo?.url) URL.revokeObjectURL(uploadedVideo.url);
                          setUploadedVideo(null);
                        }}
                      >
                        ← Change Video
                      </button>
                      <button type="button" className="btn-primary large" onClick={() => setCreationStep(3)}>
                        Continue to Live Consent
                        <span className="btn-icon">📹</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Live consent intro (video, no camera yet) */}
                {creationStep === 3 && avatarType === "video" && !showCamera && !consentVideo && (
                  <div className="step-content">
                    <div className="consent-recording-intro">
                      <div className="consent-header">
                        <span className="consent-icon">📹</span>
                        <h3>Live Consent Recording Required</h3>
                      </div>
                      <p className="consent-intro-text">
                        For security and identity verification, please record yourself reading the consent statement below.
                      </p>
                      <div className="name-input-section">
                        <label htmlFor="avatar-name-consent">Your Full Name</label>
                        <input
                          id="avatar-name-consent"
                          type="text"
                          placeholder="Enter your full name (you'll say this on camera)"
                          value={avatarName}
                          onChange={(e) => setAvatarName(e.target.value)}
                          className="avatar-name-input"
                        />
                      </div>
                      <div className="consent-script-box">
                        <h4>📜 Consent Script (You will read this on camera):</h4>
                        <div className="consent-script-text">
                          <p>
                            &quot;I, <strong className="name-highlight">{avatarName || "[Your Name]"}</strong>, consent to the creation of my AI avatar by SocialGenie.
                          </p>
                          <p>I understand that this avatar will be used to generate videos and content on my behalf.</p>
                          <p>I confirm that I am the person in the video I uploaded and I authorize the use of my likeness for avatar creation.</p>
                          <p>This consent is given freely and can be revoked at any time.</p>
                          <p>
                            Today&apos;s date is{" "}
                            <strong className="date-highlight">
                              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </strong>
                            .
                          </p>
                          <p className="consent-closing">I agree to these terms.&quot;</p>
                        </div>
                      </div>
                      <div className="recording-instructions">
                        <h4>📋 Recording Instructions:</h4>
                        <div className="instructions-grid">
                          <div className="instruction-item">
                            <span className="inst-icon">1️⃣</span>
                            <strong>Click &quot;I Agree - Start Recording&quot;</strong>
                            <p>Your camera will open</p>
                          </div>
                          <div className="instruction-item">
                            <span className="inst-icon">2️⃣</span>
                            <strong>Read the script on screen</strong>
                            <p>The consent text will appear over the camera</p>
                          </div>
                          <div className="instruction-item">
                            <span className="inst-icon">3️⃣</span>
                            <strong>Speak clearly for 30-60 seconds</strong>
                            <p>Look at the camera and read naturally</p>
                          </div>
                          <div className="instruction-item">
                            <span className="inst-icon">4️⃣</span>
                            <strong>Click &quot;Stop Recording&quot;</strong>
                            <p>Review and submit if you&apos;re happy</p>
                          </div>
                        </div>
                      </div>
                      <div className="consent-requirements">
                        <h4>✓ Requirements:</h4>
                        <div className="req-list">
                          <div className="req-item">✓ Same person as in the uploaded video</div>
                          <div className="req-item">✓ Clear, audible voice</div>
                          <div className="req-item">✓ Look at camera while reading</div>
                          <div className="req-item">✓ 30-60 seconds duration</div>
                        </div>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(2)}>
                        ← Back
                      </button>
                      <button
                        type="button"
                        className="btn-primary large consent-btn"
                        onClick={startConsentRecording}
                        disabled={!avatarName.trim()}
                      >
                        <span className="btn-icon">✅</span>
                        I Agree - Start Recording
                        <span className="btn-hint">Camera will open</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Consent recorded, not yet proceeded (e.g. Back from step 4) */}
                {creationStep === 3 && avatarType === "video" && !showCamera && consentVideo && (
                  <div className="step-content">
                    <div className="consent-section">
                      <h3>✅ Consent Video Recorded</h3>
                      <div className="preview-section">
                        <video src={consentVideo.url} controls className="video-preview" />
                        <button type="button" className="btn-secondary small" onClick={retakeConsentVideo}>
                          Record Again
                        </button>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreationStep(2)}>
                        ← Back
                      </button>
                      <button type="button" className="btn-secondary" onClick={retakeConsentVideo}>
                        🔄 Record Again
                      </button>
                      <button type="button" className="btn-primary" onClick={proceedToSubmit}>
                        Continue to Submit ✓
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Camera with consent script overlay */}
                {creationStep === 3 && avatarType === "video" && showCamera && (
                  <div className="step-content camera-step">
                    <div className="camera-container-full">
                      <div className="camera-view">
                        <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
                        <div className="consent-overlay-live">
                          <div className="consent-card-live">
                            <div className="consent-scroll">
                              <p className="consent-line">
                                &quot;I, <strong>{avatarName}</strong>, consent to the creation of my AI avatar by SocialGenie.
                              </p>
                              <p className="consent-line">I understand that this avatar will be used to generate videos and content on my behalf.</p>
                              <p className="consent-line">I confirm that I am the person in the video I uploaded and I authorize the use of my likeness for avatar creation.</p>
                              <p className="consent-line">This consent is given freely and can be revoked at any time.</p>
                              <p className="consent-line">
                                Today&apos;s date is <strong>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
                              </p>
                              <p className="consent-line consent-final">I agree to these terms.&quot;</p>
                            </div>
                            <div className="scroll-hint">📜 Read this text clearly on camera</div>
                          </div>
                        </div>
                        {isRecording && (
                          <div className="recording-indicator">
                            <span className="rec-dot" />
                            <span className="rec-text">REC {formatTime(recordingTime)}</span>
                          </div>
                        )}
                        {isRecording && (
                          <div className="recording-progress">
                            <div className="progress-fill" style={{ width: `${(recordingTime / 60) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="camera-controls">
                        {!isRecording && !consentVideo && (
                          <>
                            <button type="button" className="btn-secondary" onClick={stopConsentCamera}>
                              Cancel
                            </button>
                            <button type="button" className="btn-record" onClick={startConsentRecordingCapture}>
                              <span className="rec-icon">⏺</span>
                              Start Recording
                            </button>
                          </>
                        )}
                        {isRecording && (
                          <>
                            <div className="recording-hint">Read the consent text clearly (30-60 seconds)</div>
                            <button type="button" className="btn-stop" onClick={stopConsentRecording}>
                              <span className="stop-icon">⏹</span>
                              Stop Recording
                            </button>
                          </>
                        )}
                        {!isRecording && consentVideo && (
                          <>
                            <button type="button" className="btn-secondary" onClick={retakeConsentVideo}>
                              🔄 Record Again
                            </button>
                            <button type="button" className="btn-primary" onClick={proceedToSubmit}>
                              Continue ✓
                            </button>
                          </>
                        )}
                      </div>
                      <div className="camera-tips">
                        <div className="tip-item">✓ Read clearly</div>
                        <div className="tip-item">✓ Look at camera</div>
                        <div className="tip-item">✓ 30-60 seconds</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Final review & submit (video avatar) */}
                {creationStep === 4 && avatarType === "video" && (
                  <div className="step-content">
                    <div className="final-review">
                      <div className="success-icon-large">🎉</div>
                      <h3>Ready to Create Your Avatar!</h3>
                      <p>Review your submissions below and click Submit to start processing.</p>
                      <div className="review-grid">
                        <div className="review-card">
                          <div className="review-header">
                            <h4>📹 Your Main Video</h4>
                            <span className="video-badge main">Main Video</span>
                          </div>
                          {uploadedVideo?.url ? (
                            <>
                              <video
                                src={uploadedVideo.url}
                                controls
                                className="review-video"
                                onError={(e) => {
                                  console.error("Main video error:", e);
                                  console.log("Video URL:", uploadedVideo.url);
                                }}
                              />
                              <div className="review-info">
                                <div className="info-row">
                                  <span className="info-icon">📁</span>
                                  <span className="info-text">{uploadedVideo.name}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-icon">⏱️</span>
                                  <span className="info-text">{uploadedVideo.duration}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-icon">📊</span>
                                  <span className="info-text">{(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="video-error">
                              <span className="error-icon">⚠️</span>
                              <p>Main video not loaded</p>
                            </div>
                          )}
                        </div>
                        <div className="review-card">
                          <div className="review-header">
                            <h4>✅ Consent Video</h4>
                            <span className="video-badge consent">Live Consent</span>
                          </div>
                          {consentVideo?.url ? (
                            <>
                              <video
                                src={consentVideo.url}
                                controls
                                className="review-video"
                                onError={(e) => {
                                  console.error("Consent video error:", e);
                                  console.log("Consent URL:", consentVideo.url);
                                }}
                              />
                              <div className="review-info">
                                <div className="info-row">
                                  <span className="info-icon">📹</span>
                                  <span className="info-text">Live consent recording</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-icon">⏱️</span>
                                  <span className="info-text">{formatTime(consentVideo.durationSeconds)}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-icon">📊</span>
                                  <span className="info-text">{(consentVideo.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="video-error">
                              <span className="error-icon">⚠️</span>
                              <p>Consent video not loaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="review-details">
                        <div className="detail-item">
                          <strong>Your Name:</strong>
                          <span>{avatarName}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Avatar Type:</strong>
                          <span>Video Avatar (Premium Quality)</span>
                        </div>
                        <div className="detail-item">
                          <strong>Processing Time:</strong>
                          <span className="time-highlight">15-30 minutes</span>
                        </div>
                        <div className="detail-item">
                          <strong>Status:</strong>
                          <span className="status-ready">✓ Ready to submit</span>
                        </div>
                      </div>
                      <div className="processing-info">
                        <div className="info-icon-large">⏱️</div>
                        <h4>What Happens Next?</h4>
                        <div className="info-steps">
                          <div className="info-step">
                            <span className="step-num">1</span>
                            <span>Videos uploaded to secure server</span>
                          </div>
                          <div className="info-step">
                            <span className="step-num">2</span>
                            <span>AI analyzes your facial features and voice</span>
                          </div>
                          <div className="info-step">
                            <span className="step-num">3</span>
                            <span>Avatar model trained and optimized</span>
                          </div>
                          <div className="info-step">
                            <span className="step-num">4</span>
                            <span>
                              Avatar ready in <strong>15-30 minutes</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setCreationStep(3);
                          setShowCamera(false);
                        }}
                      >
                        ← Back to Consent
                      </button>
                      <button
                        type="button"
                        className="btn-primary large submit-btn"
                        onClick={handleCreateAvatar}
                        disabled={creating || !uploadedVideo || !consentVideo}
                      >
                        {creating ? (
                          <>
                            <span className="spinner" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">🚀</span>
                            Submit &amp; Create Avatar
                            <span className="btn-hint">Ready in 15-30 minutes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Creation Progress Banner */}
        {creationProgress && (
          <div className="fixed bottom-6 right-6 z-[100] min-w-[320px] rounded-xl border-2 border-violet-300 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⏳</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900">Creating your avatar...</p>
                <p className="text-sm text-gray-500">
                  Status: {creationProgress.status}
                  {creationProgress.estimatedTime && ` • ${creationProgress.estimatedTime}`}
                </p>
              </div>
              <Loader2 className="h-6 w-6 shrink-0 animate-spin text-violet-600" />
            </div>
          </div>
        )}

        {/* Details panel (slide-over) */}
        {browseSelectedAvatar && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-in slide-in-from-right bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900">Avatar Details</h2>
                <button onClick={() => setBrowseSelectedAvatar(null)} className="rounded-full p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 overflow-hidden rounded-xl">
                  {browseSelectedAvatar.preview && (
                    <img src={browseSelectedAvatar.preview} alt={browseSelectedAvatar.name} className="w-full" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{browseSelectedAvatar.name}</h3>
                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="font-semibold text-gray-900 capitalize">{browseSelectedAvatar.gender ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Style</dt>
                    <dd className="font-semibold text-gray-900">{browseSelectedAvatar.style ?? "normal"}</dd>
                  </div>
                  {browseSelectedAvatar.category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="font-semibold text-gray-900 capitalize">{browseSelectedAvatar.category}</dd>
                    </div>
                  )}
                  {(browseSelectedAvatar.aspectRatio || (browseSelectedAvatar.width != null && browseSelectedAvatar.height != null)) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Resolution</dt>
                      <dd className="font-semibold text-gray-900 font-mono">
                        {browseSelectedAvatar.width != null && browseSelectedAvatar.height != null
                          ? `${browseSelectedAvatar.width}×${browseSelectedAvatar.height}px${browseSelectedAvatar.aspectRatio ? ` (${browseSelectedAvatar.aspectRatio})` : ""}`
                          : browseSelectedAvatar.aspectRatio}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="font-semibold text-gray-900">
                      {browseSelectedAvatar.isCustom ? "Custom" : browseSelectedAvatar.isPaid ? "Paid" : "Free"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="font-mono text-xs text-gray-600">{browseSelectedAvatar.id}</dd>
                  </div>
                </dl>
                <button
                  onClick={() => handleUseAvatar(browseSelectedAvatar)}
                  className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-bold text-white hover:bg-violet-700"
                >
                  Use This Avatar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── VIDEO GENERATION MODE: Has pending script ───
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Avatars & Voices</h1>
          <p className="mt-1 text-gray-500">Select an avatar and voice to generate your video</p>
        </div>
        <button onClick={handleClearAndBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Scripts
        </button>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{pendingScript.topic}</h2>
          <span className="rounded-lg bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">{pendingScript.platform}</span>
        </div>
        <div className="max-h-32 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {pendingScript.script.substring(0, 400)}
          {pendingScript.script.length > 400 && "..."}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
          <span className="rounded-lg bg-violet-600 px-3 py-1 text-sm font-bold text-white">Step 1</span>
          <h2 className="text-lg font-bold text-gray-900">Select Avatar</h2>
        </div>
        {loadingAvatars ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedAvatarGroups.map(({ baseName, looks }) => {
              const first = looks[0];
              const isSelected = selectedAvatar && looks.some((l) => l.id === selectedAvatar.id);
              const lookCount = looks.length;
              return (
                <div
                  key={baseName + first.id}
                  onClick={() =>
                    lookCount === 1 ? handleAvatarSelect(first) : setLooksModalFolder({ baseName, looks })
                  }
                  className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    isSelected ? "border-violet-500 shadow ring-2 ring-violet-500/30" : "border-gray-200 hover:border-violet-300"
                  }`}
                >
                  <div className="aspect-[3/4] w-full bg-gray-100">
                    {first.preview ? (
                      <img
                        src={first.preview}
                        alt={baseName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => ((e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23f0f0f0' width='300' height='400'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E")}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-gray-400">👤</div>
                    )}
                    {first.isCustom && (
                      <div className="absolute left-2 top-2 rounded bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">Custom</div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 bg-white p-3">
                    <div className="truncate text-sm font-semibold text-gray-900">{baseName}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{lookCount === 1 ? "1 look" : `${lookCount} looks`}</div>
                  </div>
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-lg font-bold text-white shadow-lg">✓</div>
                  )}
                </div>
              );
            })}
          </div>
          {avatarGroups.length > AVATARS_PER_PAGE && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setAvatarPage((p) => Math.max(1, p - 1))}
                disabled={avatarPage <= 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {avatarPage} of {totalAvatarPages}
              </span>
              <button
                type="button"
                onClick={() => setAvatarPage((p) => Math.min(totalAvatarPages, p + 1))}
                disabled={avatarPage >= totalAvatarPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
        )}
      </div>

      {selectedAvatar && (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
            <span className="rounded-lg bg-violet-600 px-3 py-1 text-sm font-bold text-white">Step 2</span>
            <h2 className="text-lg font-bold text-gray-900">Select Voice for {selectedAvatar.name}</h2>
          </div>
          {loadingVoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <span className="ml-3 text-gray-600">Loading voices...</span>
            </div>
          ) : avatarVoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-amber-500" />
              <p>No voices available</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {avatarVoices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 p-3 transition-all ${
                    selectedVoice === voice.id ? "border-violet-500 bg-violet-50/50" : "border-gray-200 bg-white hover:border-violet-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      {voice.name}
                      {voice.id === defaultVoice && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Default</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {voice.gender && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">{voice.gender}</span>}
                      {voice.accent && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{voice.accent}</span>}
                    </div>
                  </div>
                  {voice.preview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        new Audio(voice.preview).play();
                      }}
                      className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-violet-100 hover:text-violet-700"
                    >
                      Preview
                    </button>
                  )}
                  {selectedVoice === voice.id && <span className="text-xl font-bold text-violet-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedAvatar && selectedVoice && (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
            <span className="rounded-lg bg-violet-600 px-3 py-1 text-sm font-bold text-white">Step 3</span>
            <h2 className="text-lg font-bold text-gray-900">Generate Video</h2>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">Video orientation — how it will look</p>
            <div className="grid grid-cols-2 gap-4 items-start">
              <button
                type="button"
                onClick={() => setVideoAspectRatio("9:16")}
                className={`w-full overflow-hidden rounded-xl border-2 transition-all text-left ${
                  videoAspectRatio === "9:16" ? "border-violet-500 ring-2 ring-violet-500/30" : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="aspect-[9/16] w-full bg-black flex items-center justify-center overflow-hidden">
                  {selectedAvatar.preview ? (
                    <img src={selectedAvatar.preview} alt="" className="h-full w-full object-cover object-center" />
                  ) : (
                    <span className="text-4xl text-gray-500">👤</span>
                  )}
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-center">
                  <span className="text-sm font-semibold text-gray-900">Portrait (9:16)</span>
                  <p className="text-xs text-gray-500">Reels, Stories, TikTok</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVideoAspectRatio("16:9")}
                className={`w-full overflow-hidden rounded-xl border-2 transition-all text-left ${
                  videoAspectRatio === "16:9" ? "border-violet-500 ring-2 ring-violet-500/30" : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                  {selectedAvatar.preview ? (
                    <img src={selectedAvatar.preview} alt="" className="h-full w-full object-cover object-center" />
                  ) : (
                    <span className="text-4xl text-gray-500">👤</span>
                  )}
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-center">
                  <span className="text-sm font-semibold text-gray-900">Landscape (16:9)</span>
                  <p className="text-xs text-gray-500">YouTube, LinkedIn</p>
                </div>
              </button>
            </div>
          </div>

          {videoError && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-6 w-6 shrink-0 text-amber-600" />
              <span className="flex-1 text-amber-800">{videoError}</span>
              {videoStatus === "failed" && (
                <button onClick={handleGenerateVideo} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                  Retry
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleGenerateVideo}
            disabled={!canGenerate || isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Video...
              </>
            ) : !canGenerate ? (
              effectiveCredits !== null && effectiveCredits < VIDEO_CREDITS ? <>Need {VIDEO_CREDITS} Credits</> : <>Select Avatar & Voice</>
            ) : (
              <>
                <Video className="h-5 w-5" />
                Generate Video ({VIDEO_CREDITS} Credits)
              </>
            )}
          </button>
          {videoStatus === "processing" && (
            <div className="mt-6 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 text-center">
              <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-violet-600" />
              <p className="font-medium text-gray-700">Creating your video...</p>
              <p className="mt-1 text-sm text-gray-500">This usually takes 2–5 minutes.</p>
            </div>
          )}
          {videoStatus === "completed" && videoUrl && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle className="h-6 w-6" />
                Video ready!
              </div>
              <video src={videoUrl} controls poster={thumbnailUrl ?? undefined} className="w-full rounded-xl bg-black" />
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  <Download className="h-4 w-4" />
                  Download Video
                </button>
                <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 rounded-lg border-2 border-violet-600 px-4 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50">
                  <Scissors className="h-4 w-4" />
                  Edit Video
                </button>
              </div>
            </div>
          )}
          {videoStatus === "failed" && (
            <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-600" />
              <h3 className="font-bold text-red-800">Video generation failed</h3>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t-2 border-violet-300 bg-white shadow-2xl lg:left-64">
          <div className="mx-auto max-w-4xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Scissors className="h-6 w-6" />
                Video Editor
              </h2>
              <button onClick={() => setShowEditor(false)} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {videoUrl ? (
              <div className="space-y-6">
                <video src={videoUrl} controls className="mx-auto block w-full max-w-2xl rounded-xl bg-black" />
                <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  <Download className="h-4 w-4" />
                  Download Video
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Video className="mx-auto mb-3 h-16 w-16 opacity-30" />
                <h3 className="font-bold text-gray-600">No video yet</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
