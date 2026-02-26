"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Trash2,
  RefreshCw,
  Film,
} from "lucide-react";

type ProjectStatus = "pending" | "processing" | "completed" | "failed";

interface ProjectItem {
  id: string;
  scriptId?: string;
  videoId: string | null;
  videoProvider?: string | null;
  topic: string;
  platform: string;
  script: string;
  status: ProjectStatus;
  progress: number;
  errorMessage?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = "all" | ProjectStatus;

const POLL_INTERVAL_MS = 8000;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/projects", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        const list = data.projects ?? [];
        setProjects(list);
      } else {
        if (data.code === "TABLE_NOT_FOUND") {
          setError("Projects feature is being set up. Please wait a moment and refresh the page.");
        } else if (data.code === "NO_SESSION") {
          setError("Please log in to view your projects.");
        } else {
          setError(data.error || data.message || "Unable to load projects. Please try again.");
        }
        setProjects([]);
      }
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const stats = {
    total: projects.length,
    processing: projects.filter((p) => p.status === "processing" || p.status === "pending").length,
    completed: projects.filter((p) => p.status === "completed").length,
    failed: projects.filter((p) => p.status === "failed").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-800">Could not load projects</h2>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); fetchProjects(); }}
            className="mt-4 rounded-xl bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-600">
            {projects.length} project{projects.length !== 1 ? "s" : ""} · real-time progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setLoading(true); fetchProjects(); }}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/dashboard/scripts"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            <Film className="h-4 w-4" />
            New project
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <FolderOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-800">{stats.processing}</p>
              <p className="text-sm text-amber-700">In progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-800">{stats.completed}</p>
              <p className="text-sm text-emerald-700">Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <XCircle className="h-6 w-6 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-800">{stats.failed}</p>
              <p className="text-sm text-red-700">Failed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "processing", "completed", "failed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filter === f
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-purple-300"
            }`}
          >
            {f === "all" && `All (${stats.total})`}
            {f === "processing" && `In progress (${stats.processing})`}
            {f === "completed" && `Completed (${stats.completed})`}
            {f === "failed" && `Failed (${stats.failed})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Film className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">No projects yet</h2>
          <p className="mt-2 text-gray-600">Create a script and generate a video to see it here.</p>
          <Link
            href="/dashboard/scripts"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 font-semibold text-white shadow-md hover:opacity-90"
          >
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                project.status === "failed"
                  ? "border-red-200"
                  : project.status === "processing" || project.status === "pending"
                    ? "border-amber-200"
                    : project.status === "completed"
                      ? "border-emerald-200"
                      : "border-gray-100"
              }`}
            >
              <div className="relative aspect-video bg-gray-100">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : project.status === "processing" || project.status === "pending" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-white">
                    <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
                    <span className="text-lg font-bold text-amber-700">{project.progress}%</span>
                  </div>
                ) : project.status === "failed" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-red-50">
                    <XCircle className="h-12 w-12 text-red-500" />
                    <span className="font-semibold text-red-700">Failed</span>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-50">
                    <Film className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div
                  className={`absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-bold shadow ${
                    project.status === "completed"
                      ? "bg-emerald-500 text-white"
                      : project.status === "failed"
                        ? "bg-red-500 text-white"
                        : project.status === "processing" || project.status === "pending"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-500 text-white"
                  }`}
                >
                  {project.status === "completed" && "Done"}
                  {project.status === "failed" && "Failed"}
                  {(project.status === "processing" || project.status === "pending") &&
                    `${project.progress}%`}
                  {project.status === "pending" && project.progress === 0 && "Pending"}
                </div>
              </div>

              <div className="p-4">
                <p className="line-clamp-2 text-sm font-medium text-gray-900">
                  {project.projectName || project.topic || project.script?.slice(0, 80) || "Untitled"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span>{project.platform}</span>
                  <span>·</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                {(project.status === "processing" || project.status === "pending") && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                    />
                  </div>
                )}

                {project.status === "failed" && project.errorMessage && (
                  <p className="mt-2 line-clamp-2 rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
                    {project.errorMessage}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {project.status === "completed" && project.videoUrl && (
                    <>
                      <a
                        href={project.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </a>
                      <a
                        href={project.videoUrl}
                        download
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </>
                  )}
                  {project.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (project.scriptId) router.push(`/dashboard/scripts/${project.scriptId}`);
                        else router.push("/dashboard/scripts");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
