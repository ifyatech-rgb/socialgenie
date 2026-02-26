"use client";

import { Play, Pause, Loader2 } from "lucide-react";

export interface VoicePreviewButtonProps {
  /** HeyGen preview_audio_url or similar. If missing, button is not rendered. */
  previewUrl: string | undefined | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  /** True while audio is buffering after play request. */
  loading?: boolean;
  voiceName?: string;
  /** Button size. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable play/pause button for voice previews.
 * Only one voice should play at a time — parent must stop current audio when another plays.
 * Hides when previewUrl is missing.
 */
export function VoicePreviewButton({
  previewUrl,
  isPlaying,
  onPlayPause,
  loading = false,
  voiceName = "Voice",
  size = "md",
  className = "",
}: VoicePreviewButtonProps) {
  if (!previewUrl?.trim()) return null;

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPlayPause();
      }}
      disabled={loading}
      aria-label={isPlaying ? `Pause ${voiceName} preview` : `Play ${voiceName} preview`}
      title={isPlaying ? "Pause preview" : "Preview voice"}
      className={`flex shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-700 disabled:opacity-70 ${sizeClasses} ${className} ${
        isPlaying ? "ring-2 ring-purple-300 ring-offset-2" : ""
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={iconSize} />
      ) : isPlaying ? (
        <span className="relative flex items-center justify-center">
          <Pause size={iconSize} />
          <span
            className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-30"
            style={{ animationDuration: "1.5s" }}
            aria-hidden
          />
        </span>
      ) : (
        <Play size={iconSize} className="translate-x-0.5" />
      )}
    </button>
  );
}
