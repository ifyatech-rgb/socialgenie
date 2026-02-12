"use client";

import { cn } from "@/lib/utils";

export type CaptionStyleId =
  | "matt"
  | "jess"
  | "laura"
  | "kendrick"
  | "doug"
  | "hormozi4"
  | "dan2";

export const CAPTION_STYLES: Array<{
  id: CaptionStyleId;
  name: string;
  isNew?: boolean;
  isPremium?: boolean;
}> = [
  { id: "matt", name: "Matt", isNew: true },
  { id: "jess", name: "Jess" },
  { id: "laura", name: "Laura" },
  { id: "kendrick", name: "Kendrick" },
  { id: "doug", name: "DOUG" },
  { id: "hormozi4", name: "HORMOZI 4", isPremium: true },
  { id: "dan2", name: "Dan 2" },
];

export function CaptionThumbnail({ styleId }: { styleId: CaptionStyleId }) {
  const sample = "Sample text";
  return (
    <div
      className={cn(
        "flex h-full w-full items-end justify-center rounded-lg bg-gray-900 p-2",
        "min-h-[72px]"
      )}
    >
      <span
        className={cn(
          "text-center text-xs font-bold leading-tight",
          styleId === "matt" && "bg-yellow-400 px-1.5 py-0.5 text-gray-900",
          styleId === "jess" &&
            "animate-pulse text-white drop-shadow-lg [text-shadow:0_0_8px_rgba(255,255,255,0.8)]",
          styleId === "laura" && "rounded bg-yellow-400/95 px-2 py-1 text-gray-900",
          styleId === "kendrick" && "bg-emerald-400 px-1.5 py-0.5 text-gray-900",
          styleId === "doug" &&
            "uppercase tracking-wider text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]",
          styleId === "hormozi4" &&
            "bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-0.5 text-gray-900",
          styleId === "dan2" && "rounded-md bg-yellow-300 px-2 py-1 text-gray-900"
        )}
      >
        {sample}
      </span>
    </div>
  );
}

export function CaptionStyleOption({
  style,
  selected,
  onClick,
}: {
  style: (typeof CAPTION_STYLES)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-3 text-left transition-all duration-200",
        "hover:border-violet-500 hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-violet-600 bg-violet-50/80 shadow-md"
          : "border-transparent bg-white hover:bg-gray-50"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
        <CaptionThumbnail styleId={style.id} />
        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">
            ✓
          </div>
        )}
        {style.isNew && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            New
          </span>
        )}
        {style.isPremium && (
          <span className="absolute left-2 top-2 text-sm">⭐</span>
        )}
      </div>
      <span className="mt-2 block text-sm font-medium text-gray-900">{style.name}</span>
    </button>
  );
}
