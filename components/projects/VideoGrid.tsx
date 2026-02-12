"use client";

import { VideoCard, VideoCardProps } from "./VideoCard";
import { VideoCardSkeleton } from "./VideoCardSkeleton";

interface VideoGridProps {
  videos: VideoCardProps[];
  loading?: boolean;
  hasReachedEnd?: boolean;
}

export function VideoGrid({ videos, loading = false, hasReachedEnd = true }: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
      {videos.length > 0 && hasReachedEnd && (
        <p className="py-8 text-center text-sm" style={{ color: "#888888" }}>
          You&apos;ve reached the end
        </p>
      )}
    </div>
  );
}
