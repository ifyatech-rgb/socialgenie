"use client";

import { Check } from "lucide-react";

const ITEMS = [
  "Keep your face visible at all times",
  "Look directly into the camera",
  "Record yourself speaking in a quiet, well lit environment",
  "Make sure to pause between sentences with your mouth closed",
];

export function InstructionsBox() {
  return (
    <div
      className="rounded-lg px-6 py-5"
      style={{ backgroundColor: "#E8F4F8" }}
      role="region"
      aria-label="Requirements"
    >
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {ITEMS.map((text, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#10B981]"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
              aria-hidden
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="text-sm text-[#374151]">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
