"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src?: string | null;
  poster?: string | null;
  className?: string;
  controls?: boolean;
  onTimeUpdate?: (current: number, duration: number) => void;
  "aria-label"?: string;
}

export function VideoPlayer({
  src,
  poster,
  className,
  controls = true,
  onTimeUpdate,
  "aria-label": ariaLabel = "Video player",
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onTimeUpdate) return;
    const handler = () => onTimeUpdate(el.currentTime, el.duration);
    el.addEventListener("timeupdate", handler);
    return () => el.removeEventListener("timeupdate", handler);
  }, [onTimeUpdate]);

  if (!src) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-xl bg-[#F5F5F5] text-[#6B7280]",
          className
        )}
        aria-label="No video"
      >
        <span className="text-sm">No video</span>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      controls={controls}
      playsInline
      className={cn(
        "aspect-video w-full rounded-xl bg-black shadow-md",
        className
      )}
      aria-label={ariaLabel}
    />
  );
}
