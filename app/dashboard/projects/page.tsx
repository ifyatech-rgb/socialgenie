"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FolderOpen,
  Loader2,
  Download,
  RefreshCw,
  Trash2,
  Play,
  Share2,
  Sparkles,
  ExternalLink,
  Copy,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 5000; // Poll every 5s for processing projects (server syncs on GET)

type Project = {
  id: string;
  scriptId?: string;
  videoId: string | null;
  videoProvider?: string | null;
  topic: string;
  platform: string;
  script: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  errorMessage?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "processing" | "completed" | "failed">("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video Player State
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Project | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Fetches projects from API (server syncs processing status with D-ID/HeyGen before returning). No cached data. */
  const loadProjects = useCallback(
    async (isRetry = false) => {
      if (!session && !isRetry) return;
      console.log("[Projects] 🔄 Frontend: Loading projects...");
      try {
        const res = await authFetch("/api/projects", {}, session ?? undefined);
        console.log("[Projects] 📡 Frontend: API response status:", res.status);
        const data = await res.json();
        console.log("[Projects] 📦 Frontend: Received data:", {
          success: data?.success,
          total: data?.total,
          inProgress: data?.inProgress,
          completed: data?.completed,
          failed: data?.failed,
          projectsCount: Array.isArray(data?.projects) ? data.projects.length : 0,
        });
        if (!res.ok && res.status === 401 && session && !isRetry) {
          await new Promise((r) => setTimeout(r, 400));
          return loadProjects(true);
        }
        const list: Project[] = res.ok && Array.isArray(data?.projects) ? data.projects : [];
        if (data?.success && list.length > 0) {
          console.log("[Projects] ✅ Frontend: Setting projects, statuses:", list.map((p) => ({ id: p.id, status: p.status, progress: p.progress })));
        }
        setProjects(list);
        setLoadError(null);
      } catch (e) {
        console.error("[Projects] ❌ Frontend: Failed to load projects:", e);
        setProjects([]);
        setLoadError(e instanceof Error ? e.message : "Failed to load projects");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session]
  );

  const forceRefreshAll = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await loadProjects();
      toast.success("Projects refreshed!");
    } catch (e) {
      console.error("Refresh failed:", e);
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [session, loadProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (session === null) {
      const t = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(t);
    }
  }, [session]);

  // Refetch when tab becomes visible (e.g. user generated video in another tab)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && session) loadProjects();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [session, loadProjects]);

  // Poll only while there are active (processing/pending) projects. Stop when all are completed/failed.
  useEffect(() => {
    const hasActive = projects.some(
      (p) => p.status === "processing" || p.status === "pending"
    );
    if (!hasActive || !session) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    const interval = setInterval(() => {
      console.log("[Projects] 🔄 Frontend: Polling for updates...");
      authFetch("/api/projects", {}, session)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.projects)) {
            console.log("[Projects] 📦 Frontend: Poll received", data.projects.length, "projects, statuses:", data.projects.map((p: Project) => ({ id: p.id, status: p.status, progress: p.progress })));
            setProjects(data.projects);
          }
        })
        .catch((err) => console.error("[Projects] ❌ Frontend: Poll failed", err));
    }, POLL_INTERVAL_MS);
    pollRef.current = interval;
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [projects, session]);

  function openVideoPlayer(project: Project) {
    setCurrentVideo(project);
    setShowVideoPlayer(true);
    setIsPlaying(false);
  }

  function closeVideoPlayer() {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowVideoPlayer(false);
    setCurrentVideo(null);
    setIsPlaying(false);
  }

  function togglePlayPause() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleVideoEnded() {
    setIsPlaying(false);
  }

  async function downloadVideo(videoUrl: string, projectTitle?: string) {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(projectTitle || "video").replace(/[^a-z0-9-]/gi, "-")}-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download video. Try opening in a new tab.");
    }
  }

  function shareVideo(project: Project) {
    const videoUrl = project.videoUrl || "";
    if (navigator.share) {
      navigator
        .share({
          title: project.script?.substring(0, 50) || "My Video",
          text: "Check out this video I created with SocialGenie!",
          url: videoUrl,
        })
        .catch((err) => console.log("Share failed:", err));
    } else {
      navigator.clipboard.writeText(videoUrl);
      toast.success("Video link copied to clipboard!");
    }
  }

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (!showVideoPlayer) return;
      switch (e.key) {
        case "Escape":
          closeVideoPlayer();
          break;
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "f":
        case "F":
          if (videoRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              videoRef.current.requestFullscreen();
            }
          }
          break;
      }
    }
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showVideoPlayer, isPlaying]);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Remove this project from the list?")) return;
    try {
      const res = await authFetch(`/api/projects/${projectId}`, { method: "DELETE" }, session!);
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const stats = {
    total: projects.length,
    processing: projects.filter((p) => p.status === "processing").length,
    completed: projects.filter((p) => p.status === "completed").length,
    failed: projects.filter((p) => p.status === "failed").length,
  };

  if (!session) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Projects</h1>
            <p className="mt-1 text-gray-500">Track your video generation progress in real-time</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={forceRefreshAll}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-600 bg-white px-5 py-3 font-semibold text-violet-600 hover:bg-violet-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh All
            </button>
            <Link
              href="/dashboard/scripts"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40"
            >
              <Sparkles className="h-5 w-5" />
              New Project
            </Link>
          </div>
        </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm">
          <span className="text-2xl">Total</span>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Projects</div>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4">
          <span className="text-2xl">In Progress</span>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold text-amber-700">{stats.processing}</div>
            {stats.processing > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Live
              </span>
            )}
          </div>
          <div className="text-sm text-amber-700/80">Processing</div>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
          <span className="text-2xl">Completed</span>
          <div className="text-3xl font-bold text-emerald-700">{stats.completed}</div>
          <div className="text-sm text-emerald-700/80">Ready</div>
        </div>
        <div className="rounded-2xl border-2 border-red-100 bg-red-50/50 p-4">
          <span className="text-2xl">Failed</span>
          <div className="text-3xl font-bold text-red-700">{stats.failed}</div>
          <div className="text-sm text-red-700/80">Errors</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "All", stats.total],
            ["processing", "In Progress", stats.processing],
            ["completed", "Completed", stats.completed],
            ["failed", "Failed", stats.failed],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-xl border-2 px-4 py-2 font-semibold transition-all ${
              filter === value
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-violet-300"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Loading skeleton while fetching actual status from API (no cached data shown) */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg"
              aria-hidden
            >
              <div className="h-48 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load error with retry */}
      {!loading && loadError && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-12 text-center">
          <p className="font-semibold text-red-800">Could not load projects</p>
          <p className="mt-1 text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => { setLoadError(null); setLoading(true); loadProjects(); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && filteredProjects.length === 0 && (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-16 text-center shadow-sm">
          <FolderOpen className="mx-auto h-20 w-20 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            No projects {filter !== "all" && `(${filter})`}
          </h2>
          <p className="mt-2 text-gray-500">Create your first video project to get started</p>
          <Link
            href="/dashboard/scripts"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
          >
            <Sparkles className="h-5 w-5" />
            Create Project
          </Link>
        </div>
      )}

      {/* Projects grid */}
      {!loading && !loadError && filteredProjects.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all hover:shadow-xl ${
                  project.status === "processing"
                    ? "border-amber-200"
                    : project.status === "completed"
                      ? "border-emerald-200"
                      : project.status === "failed"
                        ? "border-red-200"
                        : "border-gray-200"
                }`}
              >
                {/* Thumbnail / Preview */}
                <div className="relative h-48 bg-gray-100">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : project.status === "processing" ? (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-amber-50">
                      <div className="relative">
                        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={`url(#grad-${project.id})`}
                            strokeWidth="8"
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * project.progress) / 100}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.5s ease" }}
                          />
                          <defs>
                            <linearGradient id={`grad-${project.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-violet-600">
                            {project.progress}%
                          </span>
                          <span className="text-xs font-medium text-gray-500">Processing</span>
                        </div>
                      </div>
                    </div>
                  ) : project.status === "failed" ? (
                    <div className="flex h-full flex-col items-center justify-center bg-red-50">
                      <span className="text-4xl">Failed</span>
                      <p className="mt-2 text-sm font-medium text-red-700">
                        Generation failed
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-violet-50 text-5xl">
                      Video
                    </div>
                  )}
                  <div
                    className={`absolute right-2 top-2 rounded-lg px-3 py-1 text-xs font-bold ${
                      project.status === "processing"
                        ? "bg-amber-400 text-amber-900"
                        : project.status === "completed"
                          ? "bg-emerald-500 text-white"
                          : project.status === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-gray-400 text-white"
                    }`}
                  >
                    {project.status === "processing" && (
                      <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                    )}
                    {project.status === "processing" && `${project.progress}% Processing`}
                    {project.status === "completed" && "Ready"}
                    {project.status === "failed" && "Failed"}
                    {project.status === "pending" && "Pending"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="line-clamp-2 font-semibold text-gray-900">
                    {project.projectName || project.topic || "Untitled"}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>{project.platform}</span>
                    <span>•</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>

                  {project.status === "processing" && (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Generating video... {project.progress}%
                      </p>
                    </div>
                  )}

                  {project.status === "failed" && project.errorMessage && (
                    <div className="mt-3 flex gap-2 rounded-lg border-l-4 border-red-400 bg-red-50 p-2 text-sm text-red-800">
                      {project.errorMessage}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.status === "completed" && project.videoUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => openVideoPlayer(project)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          <Play className="h-4 w-4" />
                          Play
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadVideo(
                              project.videoUrl!,
                              project.projectName || project.topic || undefined
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => shareVideo(project)}
                          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#25d366] px-3 py-2 text-sm font-semibold text-[#25d366] hover:bg-[#25d366] hover:text-white"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </>
                    )}
                    {project.status === "processing" && (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 opacity-75"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </button>
                    )}
                    {project.status === "failed" && (
                      <Link
                        href={`/dashboard/scripts/${project.scriptId ?? project.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-400 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && currentVideo && currentVideo.videoUrl && (
        <div
          className="video-player-overlay"
          onClick={closeVideoPlayer}
          role="presentation"
        >
          <div
            className="video-player-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
          >
            <button
              type="button"
              className="player-close-btn"
              onClick={closeVideoPlayer}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="video-player-wrapper">
              <video
                ref={videoRef}
                src={currentVideo.videoUrl}
                className="video-element"
                controls
                autoPlay
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {!isPlaying && (
                <div
                  className="video-overlay"
                  onClick={togglePlayPause}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePlayPause();
                    }
                  }}
                  aria-label="Play"
                >
                  <button type="button" className="play-button-large" aria-hidden>
                    ▶️
                  </button>
                </div>
              )}
            </div>

            <div className="video-info-section">
              <div className="video-title">
                <h3>
                  {currentVideo.projectName ||
                    currentVideo.topic ||
                    currentVideo.script?.substring(0, 80) ||
                    "Untitled Video"}
                  {(currentVideo.script?.length ?? 0) > 80 && "..."}
                </h3>
                <div className="video-meta">
                  <span className="meta-badge">📱 {currentVideo.platform}</span>
                  <span className="meta-badge">
                    📅 {new Date(currentVideo.createdAt).toLocaleDateString()}
                  </span>
                  {currentVideo.duration != null && (
                    <span className="meta-badge">⏱️ {currentVideo.duration}s</span>
                  )}
                </div>
              </div>

              <div className="video-actions-bar">
                <button
                  type="button"
                  className="video-action-btn primary"
                  onClick={() =>
                    downloadVideo(
                      currentVideo.videoUrl!,
                      currentVideo.projectName || currentVideo.topic
                    )
                  }
                >
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  className="video-action-btn"
                  onClick={() => shareVideo(currentVideo)}
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  className="video-action-btn"
                  onClick={() => window.open(currentVideo.videoUrl!, "_blank")}
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Open in New Tab</span>
                </button>
                <Link
                  href="/dashboard/ai-studio"
                  className="video-action-btn"
                  onClick={() => {
                    if (currentVideo.script) {
                      try {
                        localStorage.setItem(
                          "selectedScript",
                          JSON.stringify({
                            content: currentVideo.script,
                            platform: currentVideo.platform,
                          })
                        );
                      } catch {}
                    }
                  }}
                >
                  <Copy className="h-5 w-5" />
                  <span>Recreate</span>
                </Link>
              </div>
            </div>

            {currentVideo.script && (
              <div className="script-preview-section">
                <h4>📝 Script</h4>
                <div className="script-content">{currentVideo.script}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
