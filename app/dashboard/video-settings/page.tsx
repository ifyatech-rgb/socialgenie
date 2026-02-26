"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Smartphone, Monitor, Square, ArrowLeft, Film } from "lucide-react";

const SIZE_OPTIONS = [
  {
    id: "vertical" as const,
    name: "Vertical (9:16)",
    icon: Smartphone,
    dimensions: "1080 × 1920",
    best: "TikTok, Instagram Reels, YouTube Shorts",
  },
  {
    id: "horizontal" as const,
    name: "Horizontal (16:9)",
    icon: Monitor,
    dimensions: "1920 × 1080",
    best: "YouTube, Facebook, LinkedIn",
  },
  {
    id: "square" as const,
    name: "Square (1:1)",
    icon: Square,
    dimensions: "1080 × 1080",
    best: "Instagram Feed, Facebook",
  },
];

export default function VideoSettingsPage() {
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
    preview_image_url?: string;
    thumbnail?: string;
    preview?: string;
  } | null>(null);
  const [selectedSize, setSelectedSize] = useState<"vertical" | "horizontal" | "square">("vertical");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const scriptIdFromUrl = searchParams?.get("scriptId");
      const scriptIdFromStorage = localStorage.getItem("scriptIdForVideo") ?? sessionStorage.getItem("scriptIdForVideo");
      const scriptRaw = localStorage.getItem("currentScript");
      if (scriptRaw) {
        const parsed = JSON.parse(scriptRaw) as { id?: string; topic?: string; scriptText?: string; platform?: string };
        if (parsed?.id) setScript({ id: parsed.id, topic: parsed.topic, scriptText: parsed.scriptText, platform: parsed.platform });
      } else if (scriptIdFromUrl || scriptIdFromStorage) {
        setScript({ id: scriptIdFromUrl ?? scriptIdFromStorage ?? "" });
      }
      const avatarRaw = localStorage.getItem("selectedAvatarFull") ?? sessionStorage.getItem("selectedAvatarFull");
      if (avatarRaw && avatarRaw.startsWith("{")) {
        const parsed = JSON.parse(avatarRaw) as typeof avatar;
        setAvatar(parsed);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [searchParams]);

  const handleContinue = () => {
    const effectiveScriptId = script?.id ?? scriptId ?? (typeof window !== "undefined" ? (localStorage.getItem("scriptIdForVideo") ?? sessionStorage.getItem("scriptIdForVideo")) : null);
    if (!effectiveScriptId || !avatar) {
      alert("Missing script or avatar. Please go back and select an avatar first.");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("videoSize", selectedSize);
      sessionStorage.setItem("videoSize", selectedSize);
    }
    router.push(`/dashboard/create-video?scriptId=${effectiveScriptId}`);
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
        <p className="text-gray-600">Script or avatar data not found. Please start from the script and select an avatar.</p>
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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <Link
        href={scriptId ? `/dashboard/avatars?scriptId=${scriptId}` : "/dashboard/avatars"}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Choose video size</h1>
        <p className="mt-2 text-gray-600">Select the best format for your platform</p>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 bg-gray-50/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-xs font-semibold uppercase text-gray-500">Script</span>
            <p className="font-medium text-gray-900">{script.topic || "Untitled"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-gray-500">Avatar</span>
            <p className="font-medium text-gray-900">{avatarName}</p>
          </div>
          {(avatar.voice_name || avatar.voice_id) && (
            <div>
              <span className="text-xs font-semibold uppercase text-gray-500">Voice</span>
              <p className="font-medium text-gray-900">
                {avatar.voice_name || "Default"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SIZE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedSize(opt.id)}
              className={`rounded-2xl border-2 p-6 text-left transition-all ${
                isSelected
                  ? "border-purple-600 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
              }`}
            >
              <div className="mb-4 flex justify-center text-purple-600">
                <Icon className="h-12 w-12" />
              </div>
              <h3 className="font-bold text-gray-900">{opt.name}</h3>
              <p className="mt-1 text-sm font-medium text-gray-600">{opt.dimensions}</p>
              <p className="mt-2 text-xs text-gray-500">Best for: {opt.best}</p>
              {isSelected && (
                <p className="mt-3 text-sm font-semibold text-purple-600">✓ Selected</p>
              )}
            </button>
          );
        })}
      </div>

      {avatar.thumbnail || avatar.preview ? (
        <div className="rounded-2xl border-2 border-gray-200 bg-gray-100 p-4 text-center">
          <p className="mb-2 text-sm font-semibold text-gray-700">Preview</p>
          <div
            className={`mx-auto overflow-hidden rounded-xl bg-gray-300 ${
              selectedSize === "vertical"
                ? "aspect-[9/16] max-w-[200px]"
                : selectedSize === "horizontal"
                  ? "aspect-video max-w-md"
                  : "aspect-square max-w-[280px]"
            }`}
          >
            <img
              src={avatar.thumbnail ?? avatar.preview ?? avatar.preview_image_url ?? ""}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {SIZE_OPTIONS.find((o) => o.id === selectedSize)?.dimensions}
          </p>
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white hover:bg-purple-700"
        >
          <Film className="h-5 w-5" />
          Continue to generate video
        </button>
      </div>
    </div>
  );
}
