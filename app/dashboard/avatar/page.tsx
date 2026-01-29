"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Upload,
  Check,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Video,
  RefreshCw,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarData {
  hasAvatar: boolean;
  avatarUrl: string | null;
  avatarStatus: string | null;
}

export default function CreateAvatarPage() {
  const router = useRouter();
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [loading, setLoading] = useState(true);

  // Consent (D-ID requires user to read consent in video)
  const [consentId, setConsentId] = useState<string | null>(null);
  const [consentText, setConsentText] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current avatar status and consent when needed
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch("/api/avatar");
        if (res.ok) {
          const data = await res.json();
          setAvatarData(data);
          if (data.avatarStatus === "processing") {
            setProcessing(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch avatar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvatar();
  }, []);

  // Poll avatar status when processing
  useEffect(() => {
    if (!processing) return;
    const poll = () => {
      fetch("/api/avatar")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.hasAvatar && data?.avatarStatus === "ready") {
            setAvatarData(data);
            setProcessing(false);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            toast.success("Your avatar is ready!");
          }
        })
        .catch(() => {});
    };
    pollRef.current = setInterval(poll, 5000);
    poll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [processing]);

  // Get consent when user is about to upload (video-only flow)
  const fetchConsent = useCallback(async () => {
    if (consentId) return;
    setConsentLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/avatar/consent");
      const data = await res.json();
      if (res.ok && data.consentId) {
        setConsentId(data.consentId);
        setConsentText(data.text);
      } else {
        setError(data.error || "Could not load consent. Try again.");
      }
    } catch (err) {
      setError("Could not load consent. Try again.");
    } finally {
      setConsentLoading(false);
    }
  }, [consentId]);

  // Video only
  const handleFile = useCallback((file: File) => {
    setError(null);
    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a video (MP4, MOV, WebM)");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File must be less than 100MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleCreateAvatar = async () => {
    if (!selectedFile) return;
    if (!consentId) {
      toast.error("Please load the consent step first.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const formData = new FormData();
      formData.append("consentId", consentId);
      formData.append("video", selectedFile);

      const res = await fetch("/api/avatar/create", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create avatar");
      }

      setProcessing(true);
      setSelectedFile(null);
      setPreview(null);
      toast.info("Creating your avatar. This usually takes 2–3 minutes.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create avatar");
      toast.error(err instanceof Error ? err.message : "Failed to create avatar");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadNew = async () => {
    try {
      const res = await fetch("/api/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarData({
          hasAvatar: false,
          avatarUrl: null,
          avatarStatus: null,
        });
        setConsentId(null);
        setConsentText(null);
        setSelectedFile(null);
        setPreview(null);
        toast.success("Ready to create a new avatar");
      }
    } catch {
      toast.error("Failed to reset");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <User className="h-10 w-10 text-violet-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Create Your AI Avatar
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Upload a video of yourself speaking. We&apos;ll clone your face and voice. No separate voice upload—everything comes from your video.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {avatarData?.hasAvatar && avatarData.avatarUrl && !selectedFile && !processing ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Check className="h-4 w-4" />
                Your Avatar is Ready
              </div>
              <div className="relative inline-block mb-6">
                <img
                  src={avatarData.avatarUrl}
                  alt="Your AI Avatar"
                  className="w-48 h-48 rounded-3xl object-cover border-4 border-violet-100 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-violet-600 text-white p-2 rounded-xl shadow-lg">
                  <Play className="h-5 w-5" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Looking Great!</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Your AI clone is ready. Generate videos with your face and voice.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push("/dashboard/generate-video")}
                  className="px-8 py-4 rounded-xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                >
                  <Video className="h-5 w-5" />
                  Generate Video
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleUploadNew}
                  className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Upload New Video
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            {/* Requirements: video only, no voice upload */}
            {!selectedFile && !uploading && !processing && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-6">
                <h3 className="font-semibold text-violet-900 mb-2 text-sm">
                  Video requirements
                </h3>
                <ul className="text-sm text-violet-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    At least 1 minute of you speaking (face and voice are cloned from this)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Face the camera and speak clearly
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Good lighting, minimal background noise
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    MP4, MOV, or WebM • Max 100MB
                  </li>
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {uploading || processing ? (
              <div className="text-center py-12">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" style={{ animationDuration: "1s" }} />
                  <div className="absolute inset-3 rounded-full bg-violet-50 flex items-center justify-center">
                    {processing ? (
                      <User className="h-8 w-8 text-violet-600" />
                    ) : (
                      <span className="text-xl font-bold text-violet-600">{uploadProgress}%</span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {processing ? "Creating your avatar…" : "Uploading…"}
                </h3>
                <p className="text-gray-500">
                  {processing
                    ? "This usually takes 2–3 minutes. Keep this page open."
                    : "Please don't close this page."}
                </p>
              </div>
            ) : selectedFile && preview ? (
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <video
                    src={preview}
                    className="w-48 h-48 rounded-3xl object-cover border-2 border-violet-200"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-700 shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
                <button
                  onClick={handleCreateAvatar}
                  className="w-full py-4 rounded-xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                >
                  <User className="h-5 w-5" />
                  Create Avatar
                </button>
              </div>
            ) : (
              <>
                {/* Consent step: show text user must read in the video */}
                {!consentId && !consentText && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">
                      Before uploading, you’ll need to read a short consent script at the start of your video. Load it below, then record your video (consent first, then 1+ minute of you speaking).
                    </p>
                    <button
                      onClick={fetchConsent}
                      disabled={consentLoading}
                      className="w-full py-3 rounded-xl border-2 border-violet-200 text-violet-700 font-medium hover:bg-violet-50 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {consentLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Load consent script"
                      )}
                    </button>
                  </div>
                )}
                {consentText && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs font-semibold text-amber-900 mb-2">Read this at the start of your video, then record 1+ minute of yourself speaking:</p>
                    <p className="text-sm text-amber-800 whitespace-pre-wrap">{consentText}</p>
                  </div>
                )}

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                    dragActive ? "border-violet-500 bg-violet-50" : "border-gray-300 hover:border-violet-400 hover:bg-violet-50/50"
                  )}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    }}
                  />
                  <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Upload className="h-10 w-10 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Upload Your Video
                  </h3>
                  <p className="text-gray-500 mb-4">
                    <span className="text-violet-600 font-medium">Click to browse</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-400">
                    MP4, MOV, WebM • Max 100MB • 1+ min with consent at start
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>

      {!avatarData?.hasAvatar && !selectedFile && !processing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm text-gray-400"
        >
          <p>D-ID clones both face and voice from your video. No separate voice upload.</p>
        </motion.div>
      )}
    </div>
  );
}
