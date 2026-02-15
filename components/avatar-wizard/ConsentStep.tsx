"use client";

import { useCallback } from "react";
import { ConsentRecording } from "@/components/ConsentRecording";
import { useOptionalAvatarCreation } from "@/contexts/AvatarCreationContext";

function formatConsentDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ConsentStepProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  onConsentRecorded?: (blob: Blob | null, url?: string) => void;
  onCanCreateChange?: (canCreate: boolean) => void;
  /** Optional: when user goes back from consent (e.g. to upload step) */
  onBack?: () => void;
}

export function ConsentStep({
  userName,
  onUserNameChange,
  onConsentRecorded,
  onCanCreateChange,
  onBack,
}: ConsentStepProps) {
  const ctx = useOptionalAvatarCreation();

  const handleComplete = useCallback(
    (blob: Blob, verified: boolean) => {
      if (!verified) return;
      const url = URL.createObjectURL(blob);
      onConsentRecorded?.(blob, url);
      onCanCreateChange?.(true);
      ctx?.setConsentVideo(blob, formatConsentDuration(0), formatFileSize(blob.size));
      ctx?.setUserName(userName);
    },
    [userName, onConsentRecorded, onCanCreateChange, ctx]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your name (for the consent script and verification)
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Your name for consent script"
        />
      </div>

      <ConsentRecording
        userName={userName.trim() || "Your Name"}
        onComplete={handleComplete}
        onBack={onBack}
      />
    </div>
  );
}
