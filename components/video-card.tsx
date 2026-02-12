"use client";

import { Play, Loader2, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectStatus = "ready" | "processing" | "draft" | "error";

export type VideoCardProject = {
  id: string;
  topic: string;
  projectName?: string | null;
  platform: string;
  length: number;
  duration?: number | null;
  thumbnailUrl?: string | null;
  generatedVideoUrl?: string | null;
  videoStatus?: string | null;
  videoError?: string | null;
  createdAt: string;
  status: string;
};

function getStatus(state: VideoCardProject): ProjectStatus {
  if (state.generatedVideoUrl && state.videoStatus === "completed") return "ready";
  if (state.videoStatus === "processing") return "processing";
  if (state.videoStatus === "failed") return "error";
  return "draft";
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}min`;
  }
  return `${seconds}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export function VideoCard({
  project,
  progress = 0,
  onRetry,
}: {
  project: VideoCardProject;
  progress?: number;
  onRetry?: (id: string) => void;
}) {
  const status = getStatus(project);
  const title = project.projectName || project.topic || "Untitled";
  const durationSec = project.duration ?? project.length;

  return (
    <div
      className={cn(
        "group w-[280px] rounded-2xl border-2 bg-white overflow-hidden transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:shadow-lg",
        status === "ready" && "border-green-200 hover:border-green-300",
        status === "processing" && "border-blue-200 hover:border-blue-300",
        status === "draft" && "border-gray-200 hover:border-gray-300",
        status === "error" && "border-red-200 hover:border-red-300"
      )}
    >
      <div className="block">
        <div className="aspect-video bg-gray-100 relative">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : project.generatedVideoUrl && status === "ready" ? (
            <video
              src={project.generatedVideoUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              {status === "processing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-4">
                  <Loader2 className="h-10 w-10 animate-spin mb-2" />
                  <span className="text-sm font-medium">Processing...</span>
                  <div className="w-full max-w-[200px] h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs mt-1">{progress}%</span>
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 text-red-700 p-4">
                  <AlertCircle className="h-10 w-10 mb-2" />
                  <span className="text-sm font-medium text-center">Error</span>
                </div>
              )}
              {status === "draft" && (
                <FileText className="h-12 w-12 text-gray-400" />
              )}
              {status === "ready" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="rounded-full bg-white/90 p-3 shadow-lg">
                    <Play className="h-8 w-8 text-gray-800 fill-gray-800 ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}
          {status === "ready" && !project.thumbnailUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="rounded-full bg-white/90 p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-8 w-8 text-gray-800 fill-gray-800 ml-0.5" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
            {formatDuration(durationSec)}
          </div>
        </div>

        <div className="p-4">
          <p className="font-semibold text-gray-900 truncate" title={title}>
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(project.createdAt)}</p>
          <div className="mt-2 flex items-center gap-2">
            {status === "ready" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ready
              </span>
            )}
            {status === "processing" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </span>
            )}
            {status === "draft" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Draft
              </span>
            )}
            {status === "error" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="h-3 w-3" />
                Error
              </span>
            )}
          </div>
        </div>
      </div>

      {status === "error" && onRetry && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRetry(project.id);
            }}
            className="inline-flex items-center gap-2 w-full justify-center py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
