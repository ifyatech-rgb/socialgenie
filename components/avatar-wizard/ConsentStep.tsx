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
      <ConsentRecording
        userName={userName.trim() || "Your Name"}
        onUserNameChange={onUserNameChange}
        onComplete={handleComplete}
        onBack={onBack}
      />
    </div>
  );
}
