"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Loader2 } from "lucide-react";

function looksLikeVoiceId(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const s = value.trim();
  return /^[0-9a-f]{32}$/i.test(s) || /^[0-9a-f-]{36}$/i.test(s);
}

function clearVideoFlowStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("videoSize");
  sessionStorage.removeItem("videoSize");
  localStorage.removeItem("selectedAvatar");
  sessionStorage.removeItem("selectedAvatar");
  localStorage.removeItem("selectedAvatarFull");
  sessionStorage.removeItem("selectedAvatarFull");
  localStorage.removeItem("currentScript");
  localStorage.removeItem("scriptIdForVideo");
  sessionStorage.removeItem("scriptIdForVideo");
  localStorage.removeItem("scriptIdForAvatar");
  sessionStorage.removeItem("scriptIdForAvatar");
}

export default function CreateVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams?.get("scriptId") ?? null;

  const [script, setScript] = useState<{ id: string; topic?: string; scriptText?: string; platform?: string } | null>(null);
  const [avatar, setAvatar] = useState<{
    avatar_id?: string;
    id?: string;
    avatar_name?: string;
    name?: string;
    voice_id?: string;
    voice_name?: string;
    selectedLook?: string;
  } | null>(null);
  const [videoSize, setVideoSize] = useState<string>("vertical");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const scriptRaw = localStorage.getItem("currentScript");
        let scriptResolved: typeof script = null;
        if (scriptRaw) {
          const parsed = JSON.parse(scriptRaw) as { id?: string; topic?: string; scriptText?: string; platform?: string };
          if (parsed?.id) {
            scriptResolved = { id: parsed.id, topic: parsed.topic, scriptText: parsed.scriptText, platform: parsed.platform };
            if (!parsed.scriptText?.trim() && parsed.id) {
              const res = await fetch(`/api/scripts/${parsed.id}`, { credentials: "include", cache: "no-store" });
              if (!cancelled && res.ok) {
                const data = await res.json();
                const content = data?.script?.content ?? "";
                scriptResolved = { id: parsed.id, topic: parsed.topic, scriptText: content, platform: parsed.platform };
              }
            }
          }
        }
        if (!cancelled) setScript(scriptResolved);

        const avatarRaw = localStorage.getItem("selectedAvatarFull") ?? sessionStorage.getItem("selectedAvatarFull");
        if (avatarRaw && avatarRaw.startsWith("{")) {
          setAvatar(JSON.parse(avatarRaw) as typeof avatar);
        }
        const size = localStorage.getItem("videoSize") ?? sessionStorage.getItem("videoSize");
        if (size) setVideoSize(size);
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateVideo = async () => {
    setError(null);
    const avatarId = avatar?.avatar_id ?? avatar?.id;
    if (!script?.id || !avatar) {
      setError("Missing script or avatar. Please go back and complete the flow.");
      return;
    }
    const scriptText = script.scriptText ?? "";
    if (!scriptText.trim()) {
      setError("Script content is missing. Please go back and select the script again.");
      return;
    }
    if (!avatarId) {
      setError("Invalid avatar data. Please select an avatar again.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: script.id,
          scriptText,
          avatarId,
          avatarName: avatar.avatar_name ?? avatar.name ?? avatar.selectedLook,
          avatarLook: avatar.selectedLook,
          voiceId: avatar.voice_id,
          videoSize: videoSize || "vertical",
          isTalkingPhoto: !!(avatar as { isTalkingPhoto?: boolean }).isTalkingPhoto,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error ?? "Video generation failed.";
        setError(msg);
        if (data.creditsRefunded) {
          setError((prev) => (prev ? `${prev} Your credits have been refunded.` : "Your credits have been refunded."));
        }
        if (data.projectId) {
          clearVideoFlowStorage();
          router.push(`/dashboard/projects/${data.projectId}`);
        }
        return;
      }

      clearVideoFlowStorage();

      if (data.projectId) {
        router.push(`/dashboard/projects/${data.projectId}`);
      } else if (data.project?.id) {
        router.push(`/dashboard/projects/${data.project.id}`);
      } else {
        router.push("/dashboard/projects");
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!script || !avatar) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h2 className="text-xl font-bold text-gray-900">Missing information</h2>
        <p className="text-gray-600">Script or avatar not found. Please go back and select script → avatar → video size.</p>
        <Link
          href="/dashboard/scripts"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Start over
        </Link>
      </div>
    );
  }

  const avatarId = avatar.avatar_id ?? avatar.id;
  const avatarName = avatar.avatar_name ?? avatar.name ?? avatar.selectedLook ?? "Avatar";

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <Link
        href={scriptId ? `/dashboard/video-settings?scriptId=${scriptId}` : "/dashboard/video-settings"}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate video</h1>
        <p className="mt-2 text-gray-600">Review and start generation with your selected options.</p>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-semibold uppercase text-gray-500">Script</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{script.topic || "Untitled"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-gray-500">Avatar</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{avatarName}</dd>
          </div>
          {(avatar.voice_name || avatar.voice_id) && (
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Voice</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {avatar.voice_name && !looksLikeVoiceId(avatar.voice_name)
                  ? avatar.voice_name
                  : (avatar.avatar_name || avatar.name || "Avatar") + "'s voice"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase text-gray-500">Video size</dt>
            <dd className="mt-0.5 font-medium text-gray-900 capitalize">{videoSize}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleCreateVideo}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white hover:bg-purple-700 disabled:opacity-70"
          >
            {creating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Film className="h-5 w-5" />
                Generate video
              </>
            )}
          </button>
          <Link
            href={scriptId ? `/dashboard/scripts/${scriptId}` : "/dashboard/scripts"}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
