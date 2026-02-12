"use client";

export function VideoCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="aspect-video w-full" style={{ backgroundColor: "#2a2a2a" }} />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: "#2a2a2a" }} />
        <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "#2a2a2a" }} />
      </div>
    </div>
  );
}
