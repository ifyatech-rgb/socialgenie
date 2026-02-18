"use client";

import { ArrowRight, Check, Heart, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

export type AvatarTypeChoice = "photo" | "video";

interface TypeChoiceStepProps {
  onSelect: (type: AvatarTypeChoice) => void;
  className?: string;
}

const PHOTO_CARD = {
  type: "photo" as const,
  icon: "📸",
  title: "Photo Avatar",
  description: "Quick and easy, just one photo",
  badge: "Recommended",
  badgePro: false,
  features: [
    "Upload 1 clear photo",
    "Ready in 5 to 15 minutes",
    "Perfect for beginners",
  ],
};

const VIDEO_CARD = {
  type: "video" as const,
  icon: "🎥",
  title: "Video Avatar",
  description: "Most realistic, 2 to 5 min video",
  badge: "Pro Quality",
  badgePro: true,
  features: [
    "Natural movements",
    "Ready in 15 to 30 minutes",
    "Studio quality",
  ],
};

const WHY_ITEMS = [
  { icon: Heart, title: "Build Trust", desc: "Viewers connect better with real faces" },
  { icon: TrendingUp, title: "Higher Engagement", desc: "Custom avatars get 3x more views" },
  { icon: Zap, title: "Brand Consistency", desc: "Same face in every video" },
];

export function TypeChoiceStep({ onSelect, className }: TypeChoiceStepProps) {
  return (
    <div className={cn("mx-auto max-w-3xl space-y-8", className)}>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Choose Your Avatar Type
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Select the best option for your needs
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {[PHOTO_CARD, VIDEO_CARD].map((card) => (
          <button
            key={card.type}
            type="button"
            onClick={() => onSelect(card.type)}
            className={cn(
              "relative flex flex-col rounded-2xl border-2 bg-white p-6 text-left transition-all duration-300",
              "border-gray-200 hover:border-indigo-400 hover:shadow-[0_8px_24px_rgba(102,126,234,0.2)] hover:-translate-y-0.5",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
              "sm:p-8"
            )}
          >
            <span
              className={cn(
                "absolute right-4 top-0 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold text-white sm:right-6",
                card.badgePro
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : ""
              )}
              style={card.badgePro ? undefined : { background: BRAND_GRADIENT }}
            >
              {card.badge}
            </span>
            <div className="mb-4 text-6xl sm:text-7xl" aria-hidden>
              {card.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{card.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            <ul className="mt-4 space-y-2">
              {card.features.map((text, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
              Choose {card.type === "photo" ? "Photo" : "Video"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>

      {/* Why Use a Custom Avatar? */}
      <section
        className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6"
        role="region"
        aria-label="Why use a custom avatar?"
      >
        <h3 className="mb-4 text-center text-lg font-bold text-gray-900">
          Why Use a Custom Avatar?
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: BRAND_GRADIENT }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <strong className="block font-semibold text-gray-900">{item.title}</strong>
                  <p className="mt-0.5 text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div
        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-6"
        role="region"
        aria-label="Tip"
      >
        <p className="text-sm text-gray-600">
          <strong className="text-gray-900">Tip:</strong> Photo avatars are great for quick setup.
          Video avatars provide more realistic movements and expressions.
        </p>
      </div>
    </div>
  );
}
