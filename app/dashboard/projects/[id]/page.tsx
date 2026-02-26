"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Download,
  Film,
  XCircle,
  RefreshCw,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  script_id: string | null;
  script_text: string;
  avatar_name: string;
  avatar_look: string | null;
  platform: string | null;
  status: string | null;
  video_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  credits_used: number;
  credits_refunded: boolean;
  created_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  duration?: number | null;
};

const AGGRESSIVE_SCHEDULE_MS = [
  3000, 3000, 3000, 3000, 3000,
  5000, 5000, 5000, 5000, 5000,
  10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
  15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
  30000,
];
const MAX_POLL_COUNT = 100;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const [longWaitMessage, setLongWaitMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checksCountRef = useRef(0);
  const pollingStartedForRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  const fetchProject = async () => {
    if (!id) return null;
    try {
      const res = await fetch(`/api/projects/${id}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        return data.project;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      pollingStartedForRef.current = null;
    };
  }, [id]);

  const checkVideoStatus = async (projectData: Project): Promise<boolean> => {
    if (!projectData.video_id || isCheckingRef.current) return false;
    isCheckingRef.current = true;
    const checkTime = new Date().toLocaleTimeString();
    setLastCheckTime(checkTime);

    try {
      const res = await fetch("/api/projects/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: projectData.video_id,
          projectId: projectData.id,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (data.success) {
        setProgress(data.progress ?? 0);
        setStatusMessage(data.message ?? "Processing...");
        setCheckCount((c) => c + 1);

        if (data.status === "completed") {
          setProject({
            ...projectData,
            status: "completed",
            video_url: data.videoUrl ?? null,
            thumbnail_url: data.thumbnailUrl ?? null,
            completed_at: new Date().toISOString(),
            duration: data.duration ?? undefined,
          });
          setStatusMessage("Your video is ready!");
          return true;
        }
        if (data.status === "failed") {
          setProject({
            ...projectData,
            status: "failed",
            error_message: data.error ?? "Video generation failed",
            failed_at: new Date().toISOString(),
          });
          setStatusMessage("Generation failed");
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Status check error:", e);
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!project || !id) return;
    const status = (project.status ?? "").toLowerCase();
    if ((status !== "processing" && status !== "pending") || !project.video_id) return;
    if (pollingStartedForRef.current === id) return;

    pollingStartedForRef.current = id;
    checksCountRef.current = 0;
    setProgress(0);
    setStatusMessage("Connecting to video service...");
    setCheckCount(0);
    setLongWaitMessage(null);

    const scheduleNext = () => {
      if (checksCountRef.current >= MAX_POLL_COUNT) {
        setLongWaitMessage("Taking longer than expected. You can refresh the page to check again.");
        return;
      }
      const delayIndex = Math.min(checksCountRef.current, AGGRESSIVE_SCHEDULE_MS.length - 1);
      const delay = AGGRESSIVE_SCHEDULE_MS[delayIndex];
      pollTimeoutRef.current = setTimeout(async () => {
        checksCountRef.current += 1;
        const done = await checkVideoStatus(project);
        if (!done) scheduleNext();
      }, delay);
    };

    checkVideoStatus(project).then((done) => {
      if (!done) {
        checksCountRef.current += 1;
        scheduleNext();
      }
    });
  }, [id, project?.status, project?.video_id]);

  const handleRetry = async () => {
    if (!project?.id) return;
    setRetryError(null);
    setRetrying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/retry`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        await fetchProject();
      } else {
        setRetryError(data.error ?? "Retry failed. Please try again.");
      }
    } catch (e) {
      setRetryError("Something went wrong. Please try again.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <p className="text-center text-gray-600">Project not found.</p>
        <div className="flex justify-center">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const status = (project.status ?? "").toLowerCase();
  const isProcessing = status === "processing" || status === "pending";
  const isCompleted = status === "completed";
  const isFailed = status === "failed" || status === "refunded";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <span
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            isCompleted
              ? "bg-emerald-100 text-emerald-800"
              : isFailed
                ? "bg-red-100 text-red-800"
                : isProcessing
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
          }`}
        >
          {isProcessing && "Processing"}
          {isCompleted && "Completed"}
          {isFailed && (project.credits_refunded ? "Refunded" : "Failed")}
          {!isProcessing && !isCompleted && !isFailed && (project.status ?? "Pending")}
        </span>
      </div>

      {isProcessing && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-8 text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full border-2 border-amber-400 opacity-30" style={{ animationDuration: "2s" }} />
            <span className="absolute h-3/4 w-3/4 animate-ping rounded-full border-2 border-amber-500 opacity-40" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
            <span className="absolute h-1/2 w-1/2 animate-ping rounded-full border-2 border-amber-600 opacity-50" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
            <Film className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-amber-800">Creating your video…</h2>
          <div className="mx-auto mt-4 max-w-md overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-100/50">
            <div
              className="flex h-10 items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-sm font-bold text-white transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            >
              {progress > 0 && progress < 100 ? `${Math.round(progress)}%` : null}
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-amber-800">{statusMessage || "Processing…"}</p>
          <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50/80 px-4 py-3 text-left">
            <p className="text-xs font-medium text-amber-700">Auto-syncing with video service</p>
            {lastCheckTime && (
              <p className="mt-1 text-xs text-amber-600">Last checked: {lastCheckTime}</p>
            )}
            <p className="mt-0.5 font-mono text-xs text-amber-700">Check #{checkCount + 1}</p>
          </div>
          {longWaitMessage && (
            <p className="mt-3 text-sm text-amber-700">{longWaitMessage}</p>
          )}
          <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-left">
            <p className="text-xs text-purple-800">Average time: 2–5 minutes</p>
            <p className="text-xs text-purple-700">No need to refresh — updates automatically</p>
            <p className="text-xs text-purple-600">You can leave this page and come back later</p>
          </div>
        </div>
      )}

      {isCompleted && project.video_url && (
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 px-4 py-3 text-center text-white shadow-lg">
            <p className="text-2xl font-bold">Your video is ready!</p>
          </div>
          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-black shadow-xl">
            <video
              src={project.video_url}
              controls
              className="h-full w-full"
              poster={project.thumbnail_url ?? undefined}
            >
              Your browser does not support video playback.
            </video>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={project.video_url}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <Download className="h-4 w-4" />
              Download Video
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(project.video_url!)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={() => window.open(project.video_url!, "_blank")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open in new tab
            </button>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">Video generation failed</h2>
          </div>
          {project.error_message && (
            <p className="mt-2 text-sm text-red-700">{project.error_message}</p>
          )}
          {project.credits_refunded && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              Your {project.credits_used} credits have been refunded.
            </p>
          )}
          {retryError && (
            <p className="mt-2 text-sm text-red-600">{retryError}</p>
          )}
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-70"
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {retrying ? "Retrying…" : "Retry (no extra charges)"}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Project details</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Avatar</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{project.avatar_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Look</dt>
            <dd className="mt-0.5 text-gray-900">{project.avatar_look || "Default"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Platform</dt>
            <dd className="mt-0.5 text-gray-900">{project.platform || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Credits used</dt>
            <dd className="mt-0.5 text-gray-900">{project.credits_used}</dd>
          </div>
          {project.duration != null && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Duration</dt>
              <dd className="mt-0.5 text-gray-900">{project.duration}s</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Created</dt>
            <dd className="mt-0.5 text-gray-900">
              {project.created_at
                ? new Date(project.created_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          {project.completed_at && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Completed</dt>
              <dd className="mt-0.5 text-gray-900">
                {new Date(project.completed_at).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Script</h2>
        <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
          {project.script_text}
        </div>
      </div>
    </div>
  );
}
