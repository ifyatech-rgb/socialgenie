"use client";

import { VideoPlayer } from "./VideoPlayer";
import { Check } from "lucide-react";
import Link from "next/link";

const INSTRUCTION_ITEMS = [
  "Keep your face visible at all times",
  "Look directly into the camera",
  "Record yourself speaking in a quiet, well lit environment",
  "Make sure to pause between sentences with your mouth closed",
];

export function InstructionsStep() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-center text-[32px] font-bold text-[#000000]">
        Overview
      </h1>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#1a1a1a] shadow-md">
        <video
          className="aspect-video w-full object-cover"
          src="/wizard-overview.mp4"
          controls
          playsInline
          aria-label="Overview video: guide on creating a successful Express Avatar"
        />
        <div className="absolute left-3 top-3 text-sm font-medium text-white opacity-90">
          D-ID
        </div>
        <div className="absolute bottom-12 left-0 right-0 px-4 text-right text-lg font-medium text-white drop-shadow-md">
          Hi, welcome to our guide on creating a successful{" "}
          <span className="text-[#FF6B35]">Express Avatar</span>,
        </div>
      </div>

      <div
        className="rounded-lg px-6 py-5"
        style={{ backgroundColor: "#E8F4F8" }}
        role="region"
        aria-label="Instructions"
      >
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {INSTRUCTION_ITEMS.map((text, i) => (
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

      <p className="text-center text-base text-[#6B7280]">
        Want to create a Studio Avatar?{" "}
        <Link
          href="/contact"
          className="font-medium text-[#6B7280] underline hover:text-[#000000]"
        >
          Contact us
        </Link>
      </p>
    </div>
  );
}
