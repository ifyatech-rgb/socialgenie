"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { UploadZone, type UploadedFile, type UploadMode } from "./UploadZone";
import { InstructionsBox } from "./InstructionsBox";
import { RequirementCardControlled } from "./RequirementCard";
import { useOptionalAvatarCreation } from "@/contexts/AvatarCreationContext";
import { Check } from "lucide-react";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")} min`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type UploadSubStep = "upload" | "review";

const PHOTO_REQUIREMENTS = [
  "Clear, well-lit photo",
  "Face clearly visible",
  "Looking at camera",
  "Neutral background preferred",
];

interface UploadStepProps {
  onHaveFootage: (file: UploadedFile | null) => void;
  onCanProceedChange?: (canProceed: boolean) => void;
  initialFile?: UploadedFile | null;
  avatarType?: "photo" | "video";
}

export function UploadStep({
  onHaveFootage,
  onCanProceedChange,
  initialFile = null,
  avatarType = "video",
}: UploadStepProps) {
  const ctx = useOptionalAvatarCreation();
  const [file, setFile] = useState<UploadedFile | null>(initialFile);
  const [greenScreen, setGreenScreen] = useState(false);
  const [faceConfirmed, setFaceConfirmed] = useState(false);
  const [envConfirmed, setEnvConfirmed] = useState(false);
  const syncedFileRef = useRef<UploadedFile | null>(null);

  const isPhoto = avatarType === "photo";
  const substep: UploadSubStep = file ? "review" : "upload";
  const canProceed =
    substep === "review" &&
    faceConfirmed &&
    (isPhoto || envConfirmed);

  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

  // Sync main video to AvatarCreationContext so verify step / verify page can display it
  useEffect(() => {
    if (!file || !ctx || syncedFileRef.current === file) return;
    syncedFileRef.current = file;
    const size = formatFileSize(file.file.size);
    if (avatarType === "photo") {
      ctx.setMainVideo(file.file, "", size);
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = formatDuration(video.duration);
      ctx.setMainVideo(file.file, duration, size);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      ctx.setMainVideo(file.file, "0:00", size);
    };
    video.src = file.url;
  }, [file, ctx, avatarType]);

  const handleUpload = (f: UploadedFile) => {
    setFile(f);
    onHaveFootage(f);
  };

  const handleRemove = () => {
    if (file?.url) URL.revokeObjectURL(file.url);
    syncedFileRef.current = null;
    setFile(null);
    setFaceConfirmed(false);
    setEnvConfirmed(false);
    onHaveFootage(null);
    ctx?.clearMainVideo();
  };

  const uploadMode: UploadMode = avatarType;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <>
        {substep === "upload" ? (
          <div key="upload" className="space-y-8">
            <h1 className="text-center text-[32px] font-bold text-[#000000]">
              {isPhoto ? "Upload your photo" : "Upload footage to create your Avatar"}
            </h1>
            <p className="text-center text-base text-[#6B7280]">
              {isPhoto
                ? "Upload a clear photo of yourself (JPG, PNG, max 10MB)"
                : "Upload a 2 to 5 minute video of yourself speaking (MP4, MOV)"}
            </p>
            <UploadZone onUpload={handleUpload} mode={uploadMode} />
            {isPhoto ? (
              <div
                className="rounded-lg px-6 py-5"
                style={{ backgroundColor: "#E8F4F8" }}
                role="region"
                aria-label="Photo requirements"
              >
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {PHOTO_REQUIREMENTS.map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#10B981]"
                        style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                        aria-hidden
                      >
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-[#374151]">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <InstructionsBox />
            )}
          </div>
        ) : (
          <div key="review" className="space-y-8">
            <h1 className="text-center text-[32px] font-bold text-[#000000]">
              {isPhoto ? "Review your photo" : "Review your footage"}
            </h1>

            <div className="relative overflow-hidden rounded-lg bg-black">
              {isPhoto && file?.url ? (
                <img
                  src={file.url}
                  alt="Uploaded photo"
                  className="mx-auto max-h-[400px] w-full object-contain"
                />
              ) : (
                <VideoPlayer
                  src={file?.url ?? undefined}
                  aria-label="Uploaded footage"
                />
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 text-[#6B7280] shadow hover:bg-white hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                aria-label="Remove"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {!isPhoto && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={greenScreen}
                  onChange={(e) => setGreenScreen(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E5E7EB] text-[#000000] focus:ring-[#000000]"
                  aria-describedby="greenscreen-info"
                />
                <span className="text-base text-[#000000]">
                  My footage has a green screen
                </span>
                <span
                  id="greenscreen-info"
                  className="ml-1 text-[#6B7280]"
                  title="Check if your video was recorded with a green screen background"
                  aria-label="Information"
                >
                  ⓘ
                </span>
              </label>
            )}

            <section aria-labelledby="check-requirements-heading">
              <h2
                id="check-requirements-heading"
                className="mb-4 text-center text-2xl font-bold text-[#000000]"
              >
                Check requirements
              </h2>
              <div className="space-y-3">
                <RequirementCardControlled
                  icon="😊"
                  text={
                    isPhoto
                      ? "I confirm this is my photo and I have the rights to use it"
                      : "My face is visible at all times and I'm looking directly at the camera"
                  }
                  confirmed={faceConfirmed}
                  onConfirm={() => setFaceConfirmed(true)}
                />
                {!isPhoto && (
                  <RequirementCardControlled
                    icon="🔊"
                    text="The environment is quiet and well lit"
                    confirmed={envConfirmed}
                    onConfirm={() => setEnvConfirmed(true)}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </>
    </div>
  );
}

export type UploadStepResult = {
  file: UploadedFile;
  greenScreen: boolean;
  faceConfirmed: boolean;
  envConfirmed: boolean;
};

export function useUploadStepState(initialFile?: UploadedFile | null) {
  const [file, setFile] = useState<UploadedFile | null>(initialFile ?? null);
  const [greenScreen, setGreenScreen] = useState(false);
  const [faceConfirmed, setFaceConfirmed] = useState(false);
  const [envConfirmed, setEnvConfirmed] = useState(false);

  const substep: UploadSubStep = file ? "review" : "upload";
  const canProceed =
    substep === "review" && faceConfirmed && envConfirmed;

  return {
    file,
    setFile,
    greenScreen,
    setGreenScreen,
    faceConfirmed,
    setFaceConfirmed,
    envConfirmed,
    setEnvConfirmed,
    substep,
    canProceed,
    handleUpload: (f: UploadedFile) => {
      setFile(f);
    },
    handleRemove: () => {
      if (file?.url) URL.revokeObjectURL(file.url);
      setFile(null);
      setFaceConfirmed(false);
      setEnvConfirmed(false);
    },
  };
}
