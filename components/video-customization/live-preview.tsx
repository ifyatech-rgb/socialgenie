"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CaptionStyleId } from "./caption-preview";
import { PRESET_BACKGROUNDS } from "./background-presets";

interface LivePreviewProps {
  format: "9:16" | "16:9" | "1:1";
  layout: "original" | "circle" | "square";
  bgOption: "default" | "color" | "green_screen" | "image";
  backgroundColor: string;
  backgroundImageUrl: string;
  selectedPresetBg: string;
  captionsEnabled: boolean;
  captionStyle: CaptionStyleId;
  avatarPreviewUrl?: string | null;
}

const PRESET_MAP: Record<string, string> = Object.fromEntries(
  PRESET_BACKGROUNDS.map((bg) => [bg.id, bg.css])
);

export function LivePreview(props: LivePreviewProps) {
  const {
    format,
    layout,
    bgOption,
    backgroundColor,
    backgroundImageUrl,
    selectedPresetBg,
    captionsEnabled,
    captionStyle,
    avatarPreviewUrl,
  } = props;

  const [refreshKey, setRefreshKey] = useState(0);

  const aspectClass =
    format === "9:16"
      ? "aspect-[9/16]"
      : format === "16:9"
        ? "aspect-video"
        : "aspect-square";

  let backgroundStyle: React.CSSProperties = {};
  if (bgOption === "color") {
    backgroundStyle = { background: backgroundColor };
  } else if (bgOption === "green_screen") {
    backgroundStyle = { background: "#008000" };
  } else if (selectedPresetBg && PRESET_MAP[selectedPresetBg]) {
    backgroundStyle = { background: PRESET_MAP[selectedPresetBg] };
  } else if (bgOption === "image" && backgroundImageUrl) {
    backgroundStyle = { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: "cover" };
  } else {
    backgroundStyle = { background: "linear-gradient(180deg,#1f2937 0%,#111827 100%)" };
  }

  const shapeClass =
    layout === "circle"
      ? "rounded-full"
      : layout === "square"
        ? "rounded-none"
        : "rounded-xl";

  return (
    <div className="w-full max-w-sm shrink-0 lg:sticky lg:top-8">
      <h3 className="mb-3 text-sm font-semibold text-gray-500">Preview</h3>
      <div
        key={refreshKey}
        className={cn(
          "overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-900 shadow-xl",
          aspectClass
        )}
      >
        <div
          className="relative flex h-full w-full flex-col items-center justify-center p-4"
          style={backgroundStyle}
        >
          {/* Avatar area */}
          <div className="flex flex-1 items-center justify-center">
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt="Avatar"
                className={cn("h-1/2 w-auto object-cover", shapeClass)}
              />
            ) : (
              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white",
                  shapeClass
                )}
              >
                👤
              </div>
            )}
          </div>

          {/* Caption preview */}
          {captionsEnabled && (
            <div className="w-full px-2 pb-6 pt-2">
              <span
                className={cn(
                  "block text-center text-xs font-bold leading-tight",
                  captionStyle === "matt" && "bg-yellow-400 px-2 py-1 text-gray-900",
                  captionStyle === "jess" && "text-white drop-shadow-lg",
                  captionStyle === "laura" && "rounded bg-yellow-400/95 px-2 py-1 text-gray-900",
                  captionStyle === "kendrick" && "bg-emerald-400 px-2 py-1 text-gray-900",
                  captionStyle === "doug" &&
                    "uppercase tracking-wider text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]",
                  captionStyle === "hormozi4" &&
                    "bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-1 text-gray-900",
                  captionStyle === "dan2" && "rounded-md bg-yellow-300 px-2 py-1 text-gray-900"
                )}
              >
                Sample caption text
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="preview-controls mt-3">
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-violet-400"
        >
          <span aria-hidden>🔄</span>
          Refresh Preview
        </button>
      </div>
    </div>
  );
}
