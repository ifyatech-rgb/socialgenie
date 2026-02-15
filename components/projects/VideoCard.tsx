"use client";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { CircularProgress } from "./CircularProgress";

export type VideoCardStatus = "processing" | "error" | "completed";

export interface VideoCardProps {
  id: string;
  thumbnailUrl: string | null;
  status: VideoCardStatus;
  progress: number;
  timestamp: string;
  videoType: string;
  avatarUrl?: string | null;
  displayId?: string;
}

export function VideoCard({ id, thumbnailUrl, status, progress, timestamp, videoType, avatarUrl, displayId }: VideoCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/projects/${id}`)}
      className="cursor-pointer overflow-hidden rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {thumbnailUrl && status === "completed" ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: status === "error" ? "#1a1a1a" : "#0d0d0d" }}>
            {status === "error" && thumbnailUrl && (
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            )}
          </div>
        )}
        <div
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-white/80" />
          )}
        </div>
        {status === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <CircularProgress progress={progress} size={100} />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-end p-3">
            <span className="font-semibold" style={{ color: "#ff4444", fontWeight: 600 }}>
              Error
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm" style={{ color: "#ffffff", fontSize: "14px" }} title={id}>
          {displayId ?? id}
        </p>
        <p className="text-xs" style={{ color: "#888888", fontSize: "12px" }}>
          {timestamp} • {videoType}
        </p>
      </div>
    </div>
  );
}
