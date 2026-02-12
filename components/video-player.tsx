"use client";

import { useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMuted = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress(duration ? (video.currentTime / duration) * 100 : 0);
  }, [duration]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      const time = pct * duration;
      video.currentTime = time;
      setProgress(pct * 100);
      setCurrentTime(time);
    },
    [duration]
  );

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen?.() ?? document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("rounded-2xl overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onClick={togglePlay}
      />
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 fill-white ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={toggleMuted}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
        <span className="text-sm text-gray-400 tabular-nums">
          {formatTime(currentTime)} / {duration ? formatTime(duration) : "0:00"}
        </span>
        <div
          className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
