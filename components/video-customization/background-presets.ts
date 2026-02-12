export const PRESET_BACKGROUNDS: Array<{
  id: string;
  name: string;
  css: string;
  hex?: string;
}> = [
  { id: "office", name: "Office", css: "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%)", hex: "#c7d2fe" },
  { id: "living", name: "Living room", css: "linear-gradient(180deg,#fef3c7 0%,#fde68a 100%)", hex: "#fde68a" },
  { id: "studio-dark", name: "Studio (dark)", css: "linear-gradient(180deg,#1f2937 0%,#111827 100%)", hex: "#1f2937" },
  { id: "studio-light", name: "Studio (light)", css: "linear-gradient(180deg,#f9fafb 0%,#e5e7eb 100%)", hex: "#e5e7eb" },
  { id: "gradient-purple", name: "Gradient purple", css: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#c4b5fd 100%)", hex: "#7c3aed" },
  { id: "gradient-blue", name: "Gradient blue", css: "linear-gradient(135deg,#3b82f6 0%,#60a5fa 50%,#93c5fd 100%)", hex: "#3b82f6" },
  { id: "nature", name: "Nature", css: "linear-gradient(180deg,#86efac 0%,#4ade80 50%,#22c55e 100%)", hex: "#22c55e" },
  { id: "bookshelf", name: "Bookshelf", css: "linear-gradient(90deg,#78716c 0%,#a8a29e 100%)", hex: "#78716c" },
  { id: "minimal", name: "Modern minimal", css: "linear-gradient(180deg,#fafafa 0%,#f4f4f5 100%)", hex: "#f4f4f5" },
];

export type BackgroundPresetValue = { id: string; name: string; value: string };

const allPresets: BackgroundPresetValue[] = PRESET_BACKGROUNDS.map((p) => ({
  id: p.id,
  name: p.name,
  value: p.css,
}));

export const POPULAR_PRESETS: BackgroundPresetValue[] = allPresets.filter((p) =>
  ["office", "living", "studio-dark", "studio-light"].includes(p.id)
);
export const GRADIENT_PRESETS: BackgroundPresetValue[] = allPresets.filter((p) =>
  ["gradient-purple", "gradient-blue", "nature"].includes(p.id)
);
export const PROFESSIONAL_PRESETS: BackgroundPresetValue[] = allPresets.filter((p) =>
  ["bookshelf", "minimal"].includes(p.id)
);
