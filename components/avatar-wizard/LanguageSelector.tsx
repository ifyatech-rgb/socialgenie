"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
] as const;

interface LanguageSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function LanguageSelector({
  value = "en",
  onChange,
  className,
  "aria-label": ariaLabel = "Select language",
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.value === value) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-left text-base text-[#000000] hover:border-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>
          {current.flag} {current.label}
        </span>
        <ChevronDown
          className={cn("h-5 w-5 text-[#6B7280] transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
          aria-label={ariaLabel}
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.value} role="option" aria-selected={value === lang.value}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-base hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none"
                onClick={() => {
                  onChange?.(lang.value);
                  setOpen(false);
                }}
              >
                {lang.flag} {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
