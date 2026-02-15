"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequirementCardProps {
  icon: string;
  text: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  className?: string;
}

export function RequirementCard({
  icon,
  text,
  onConfirm,
  confirmLabel = "Confirm",
  className,
}: RequirementCardProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm?.();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border-2 p-5 transition-colors",
        confirmed ? "bg-[#E8F8F0] border-[#10B981]" : "bg-white border-[#E5E7EB]",
        className
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm"
        aria-hidden
      >
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-base text-[#000000]">{text}</p>
      {!confirmed && onConfirm && (
        <button
          type="button"
          onClick={handleConfirm}
          className="shrink-0 rounded-md bg-[#000000] px-6 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
          aria-label={`Confirm: ${text}`}
        >
          {confirmLabel}
        </button>
      )}
      {confirmed && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white"
          aria-label="Confirmed"
        >
          <Check className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function RequirementCardControlled({
  icon,
  text,
  confirmed,
  onConfirm,
  confirmLabel = "Confirm",
  className,
}: RequirementCardProps & { confirmed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border-2 p-5 transition-colors",
        confirmed ? "bg-[#E8F8F0] border-[#10B981]" : "bg-white border-[#E5E7EB]",
        className
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm"
        aria-hidden
      >
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-base text-[#000000]">{text}</p>
      {!confirmed && onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="shrink-0 rounded-md bg-[#000000] px-6 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
          aria-label={`Confirm: ${text}`}
        >
          {confirmLabel}
        </button>
      )}
      {confirmed && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white"
          aria-label="Confirmed"
        >
          <Check className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
