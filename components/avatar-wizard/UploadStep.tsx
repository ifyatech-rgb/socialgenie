"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { UploadZone, type UploadedFile } from "./UploadZone";
import { InstructionsBox } from "./InstructionsBox";
import { RequirementCardControlled } from "./RequirementCard";
import { useOptionalAvatarCreation } from "@/contexts/AvatarCreationContext";

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

interface UploadStepProps {
  onHaveFootage: (file: UploadedFile | null) => void;
  onCanProceedChange?: (canProceed: boolean) => void;
  initialFile?: UploadedFile | null;
}

export function UploadStep({
  onHaveFootage,
  onCanProceedChange,
  initialFile = null,
}: UploadStepProps) {
  const ctx = useOptionalAvatarCreation();
  const [file, setFile] = useState<UploadedFile | null>(initialFile);
  const [greenScreen, setGreenScreen] = useState(false);
  const [faceConfirmed, setFaceConfirmed] = useState(false);
  const [envConfirmed, setEnvConfirmed] = useState(false);
  const syncedFileRef = useRef<UploadedFile | null>(null);

  const substep: UploadSubStep = file ? "review" : "upload";
  const canProceed =
    substep === "review" && faceConfirmed && envConfirmed;

  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

  // Sync main video to AvatarCreationContext so verify step / verify page can display it
  useEffect(() => {
    if (!file || !ctx || syncedFileRef.current === file) return;
    syncedFileRef.current = file;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = formatDuration(video.duration);
      const size = formatFileSize(file.file.size);
      ctx.setMainVideo(file.file, duration, size);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      ctx.setMainVideo(file.file, "0:00", formatFileSize(file.file.size));
    };
    video.src = file.url;
  }, [file, ctx]);

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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AnimatePresence mode="wait">
        {substep === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <h1 className="text-center text-[32px] font-bold text-[#000000]">
              Upload footage to create your Avatar
            </h1>
            <UploadZone onUpload={handleUpload} />
            <InstructionsBox />
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <h1 className="text-center text-[32px] font-bold text-[#000000]">
              Review your footage
            </h1>

            <div className="relative">
              <VideoPlayer
                src={file?.url ?? undefined}
                aria-label="Uploaded footage"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 text-[#6B7280] shadow hover:bg-white hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                aria-label="Remove footage"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

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
                  text="My face is visible at all times and I'm looking directly at the camera"
                  confirmed={faceConfirmed}
                  onConfirm={() => setFaceConfirmed(true)}
                />
                <RequirementCardControlled
                  icon="🔊"
                  text="The environment is quiet and well lit"
                  confirmed={envConfirmed}
                  onConfirm={() => setEnvConfirmed(true)}
                />
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
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
