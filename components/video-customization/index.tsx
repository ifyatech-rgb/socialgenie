"use client";

import { cn } from "@/lib/utils";
import { FileText, User, MessageSquare, Image, Layout, Smartphone } from "lucide-react";
import { CAPTION_STYLES, CaptionStyleOption, type CaptionStyleId } from "./caption-preview";
import { PRESET_BACKGROUNDS } from "./background-presets";

export type TabId = "script" | "avatar" | "captions" | "background" | "layout" | "format";

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "script", label: "Script", icon: FileText },
  { id: "avatar", label: "Avatar & Voice", icon: User },
  { id: "captions", label: "Captions", icon: MessageSquare },
  { id: "background", label: "Background", icon: Image },
  { id: "layout", label: "Layout", icon: Layout },
  { id: "format", label: "Format", icon: Smartphone },
];

export interface VideoCustomizationProps {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  // Script
  scripts: Array<{ id: string; topic: string; platform: string }>;
  selectedScript: string;
  onSelectScript: (id: string) => void;
  // Avatar & Voice
  avatars: Array<{ avatar_id: string; avatar_name?: string; preview_image_url?: string; gender?: string }>;
  voices: Array<{ voice_id: string; name?: string; display_name?: string }>;
  selectedAvatar: string;
  selectedVoice: string;
  onSelectAvatar: (id: string) => void;
  onSelectVoice: (id: string) => void;
  hasCustomAvatar?: boolean;
  useClonedVoice?: boolean;
  onUseClonedVoice?: (v: boolean) => void;
  loadingOptions?: boolean;
  // Captions
  captionsEnabled: boolean;
  onCaptionsEnabled: (v: boolean) => void;
  selectedCaptionStyle: CaptionStyleId;
  onSelectCaptionStyle: (id: CaptionStyleId) => void;
  // Background
  bgOption: "default" | "color" | "green_screen" | "image";
  onBgOption: (v: "default" | "color" | "green_screen" | "image") => void;
  backgroundColor: string;
  onBackgroundColor: (v: string) => void;
  backgroundImageUrl: string;
  onBackgroundImageUrl: (v: string) => void;
  selectedPresetBg: string;
  onSelectPresetBg: (id: string) => void;
  // Layout
  layout: "original" | "circle" | "square";
  onLayout: (v: "original" | "circle" | "square") => void;
  // Format
  format: "9:16" | "16:9" | "1:1";
  onFormat: (v: "9:16" | "16:9" | "1:1") => void;
}

export function VideoCustomizationSidebar(props: VideoCustomizationProps) {
  const {
    activeTab,
    setActiveTab,
    scripts,
    selectedScript,
    onSelectScript,
    avatars,
    voices,
    selectedAvatar,
    selectedVoice,
    onSelectAvatar,
    onSelectVoice,
    hasCustomAvatar,
    useClonedVoice = true,
    onUseClonedVoice,
    loadingOptions,
    captionsEnabled,
    onCaptionsEnabled,
    selectedCaptionStyle,
    onSelectCaptionStyle,
    bgOption,
    onBgOption,
    backgroundColor,
    onBackgroundColor,
    backgroundImageUrl,
    onBackgroundImageUrl,
    selectedPresetBg,
    onSelectPresetBg,
    layout,
    onLayout,
    format,
    onFormat,
  } = props;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      {/* Tabs + content */}
      <div className="flex-1 space-y-6">
        <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-[280px]">
          {/* Script */}
          {activeTab === "script" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Script</h3>
              <p className="text-sm text-gray-500">Choose the script for your video</p>
              <div className="space-y-2">
                {scripts.length === 0 ? (
                  <p className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-500">
                    No scripts yet. Create one first.
                  </p>
                ) : (
                  scripts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectScript(s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                        selectedScript === s.id
                          ? "border-violet-600 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{s.topic}</p>
                        <p className="text-sm text-gray-500">{s.platform}</p>
                      </div>
                      {selectedScript === s.id && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
                          Selected
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Avatar & Voice */}
          {activeTab === "avatar" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Avatar & Voice</h3>
              {loadingOptions ? (
                <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
              ) : (
                <>
                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">Avatar</p>
                    <div className="grid grid-cols-3 gap-3">
                      {avatars.map((a) => (
                        <button
                          key={a.avatar_id}
                          type="button"
                          onClick={() => onSelectAvatar(a.avatar_id)}
                          className={cn(
                            "relative overflow-hidden rounded-xl border-2 transition-all",
                            selectedAvatar === a.avatar_id
                              ? "border-violet-600 ring-2 ring-violet-200"
                              : "border-gray-200 hover:border-violet-300"
                          )}
                        >
                          {a.preview_image_url ? (
                            <img
                              src={a.preview_image_url}
                              alt={a.avatar_name || a.avatar_id}
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center bg-gray-100">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <p className="truncate p-1.5 text-xs font-medium text-gray-900">
                            {a.avatar_name || a.avatar_id.slice(0, 8)}
                          </p>
                          {selectedAvatar === a.avatar_id && (
                            <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                              ✓
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Voice</p>
                    {hasCustomAvatar && onUseClonedVoice && (
                      <label className="mb-3 flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useClonedVoice}
                          onChange={(e) => onUseClonedVoice(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-violet-600"
                        />
                        <span className="text-sm text-gray-700">Use my cloned voice</span>
                      </label>
                    )}
                    <select
                      value={selectedVoice}
                      onChange={(e) => onSelectVoice(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
                    >
                      {voices.length > 0
                        ? voices.slice(0, 12).map((v) => (
                            <option key={v.voice_id} value={v.voice_id}>
                              {v.name || v.display_name || v.voice_id}
                            </option>
                          ))
                        : <option value="default">Default</option>}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Captions */}
          {activeTab === "captions" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Caption Style</h3>
              <p className="text-sm text-gray-500">Choose how captions appear in your video</p>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={captionsEnabled}
                  onChange={(e) => onCaptionsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600"
                />
                <span className="text-sm font-medium text-gray-700">Add captions / subtitles</span>
              </label>
              {captionsEnabled && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {CAPTION_STYLES.map((style) => (
                    <CaptionStyleOption
                      key={style.id}
                      style={style}
                      selected={selectedCaptionStyle === style.id}
                      onClick={() => onSelectCaptionStyle(style.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Background */}
          {activeTab === "background" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Avatar Background</h3>
              <p className="text-sm text-gray-500">Customize, remove, or choose a preset</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { id: "default" as const, label: "Default", icon: "◇" },
                  { id: "color" as const, label: "Color", icon: "■" },
                  { id: "green_screen" as const, label: "Remove", icon: "⊘" },
                  { id: "image" as const, label: "Image URL", icon: "🖼" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onBgOption(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                      bgOption === opt.id
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300"
                    )}
                  >
                    <span className="text-2xl text-gray-600">{opt.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
              {bgOption === "color" && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColor(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
              {bgOption === "image" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    type="url"
                    value={backgroundImageUrl}
                    onChange={(e) => onBackgroundImageUrl(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Preset Backgrounds</h4>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => onSelectPresetBg(bg.id)}
                      className={cn(
                        "relative aspect-video rounded-lg border-2 transition-all",
                        selectedPresetBg === bg.id && "ring-2 ring-violet-600 ring-offset-2"
                      )}
                      style={{ background: bg.css }}
                    >
                      {selectedPresetBg === bg.id && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
                            ✓
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layout */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Layout</h3>
              <p className="text-sm text-gray-500">Avatar shape in the video</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "original" as const, label: "Original", shape: "rounded-lg" },
                  { id: "circle" as const, label: "Circle", shape: "rounded-full" },
                  { id: "square" as const, label: "Square", shape: "rounded-none" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onLayout(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                      layout === opt.id
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300"
                    )}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-800">
                      <div
                        className={cn(
                          "h-14 w-14 bg-gradient-to-br from-indigo-400 to-purple-500",
                          opt.shape
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format */}
          {activeTab === "format" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Video Format</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { id: "9:16" as const, label: "Portrait", size: "9:16 (1080×1920)", icon: "📱" },
                  { id: "16:9" as const, label: "Landscape", size: "16:9 (1920×1080)", icon: "🖥️" },
                  { id: "1:1" as const, label: "Square", size: "1:1 (1080×1080)", icon: "⬜" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onFormat(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all",
                      format === opt.id
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="font-semibold text-gray-900">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
