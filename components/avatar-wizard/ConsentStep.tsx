"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, RotateCcw } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { LanguageSelector } from "./LanguageSelector";
import { RecordingOverlay } from "./RecordingOverlay";
import { useOptionalAvatarCreation } from "@/contexts/AvatarCreationContext";

const PASSCODE_WORDS = [
  "butterfly",
  "pond",
  "rain",
  "forest",
  "mountain",
  "river",
  "sunset",
  "meadow",
];

function generatePasscode(): string[] {
  const shuffled = [...PASSCODE_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

interface ConsentStepProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  onConsentRecorded?: (blob: Blob | null, url?: string) => void;
  onCanCreateChange?: (canCreate: boolean) => void;
}

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

export function ConsentStep({
  userName,
  onUserNameChange,
  onConsentRecorded,
  onCanCreateChange,
}: ConsentStepProps) {
  const ctx = useOptionalAvatarCreation();
  const [language, setLanguage] = useState("en");
  const [showOverlay, setShowOverlay] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const passcode = useMemo(() => generatePasscode(), [showOverlay]);

  const consentStatement = `I, ${userName || "[user name]"} confirm that I have all the necessary rights or consents to use this footage and voice recording for creating an Avatar from my 'User Submission' all in accordance with the Terms of Use. This is my dynamic passcode ${passcode.join(", ")}.`;

  const displayPasscodePlaceholder = "***, ***, ***";

  const handleRecordingComplete = (blob: Blob, durationSeconds?: number) => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    const url = URL.createObjectURL(blob);
    setRecordedBlob(blob);
    setRecordedUrl(url);
    setShowOverlay(false);
    onConsentRecorded?.(blob, url);
    onCanCreateChange?.(true);
    ctx?.setConsentVideo(
      blob,
      formatConsentDuration(durationSeconds ?? 0),
      formatFileSize(blob.size)
    );
    ctx?.setUserName(userName);
  };

  const handleRestart = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    onConsentRecorded?.(null);
    onCanCreateChange?.(false);
  };

  const consentTextWithPlaceholder = `I, ${userName || "[user name]"} confirm that I have all the necessary rights or consents to use this footage and voice recording for creating an Avatar from my 'User Submission' all in accordance with the Terms of Use. This is my dynamic passcode ${displayPasscodePlaceholder}`;

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-center text-[32px] font-bold text-[#000000]">
          Record consent
        </h1>
        <p className="text-center text-base text-[#6B7280]">
          To prevent technology misuse, we need to confirm the person in the
          video is you by reading a consent statement and dynamic passcode.
        </p>

        <LanguageSelector value={language} onChange={setLanguage} />

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
          <p className="text-base text-[#374151]">
            I,{" "}
            <input
              type="text"
              value={userName}
              onChange={(e) => onUserNameChange(e.target.value)}
              placeholder="[user name]"
              className="inline-block w-32 border-b border-[#E5E7EB] bg-transparent px-1 py-0.5 focus:border-[#000000] focus:outline-none"
              aria-label="Your name"
            />{" "}
            confirm that I have all the necessary rights or consents to use this
            footage and voice recording for creating an Avatar from my &apos;User
            Submission&apos; all in accordance with the Terms of Use. This is my
            dynamic passcode {displayPasscodePlaceholder}.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!recordedUrl ? (
            <motion.div
              key="record-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-12 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setShowOverlay(true)}
                className="flex flex-col items-center gap-3 rounded-lg py-4 transition hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
                aria-label="Record with webcam"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5E7EB]">
                  <Video className="h-8 w-8 text-[#6B7280]" />
                </div>
                <span className="text-base font-medium text-[#000000]">
                  Record with webcam
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="recorded-review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <VideoPlayer
                  src={recordedUrl}
                  aria-label="Recorded consent video"
                />
                <button
                  type="button"
                  onClick={handleRestart}
                  className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#374151] shadow hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  aria-label="Restart recording"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart recording
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showOverlay && (
        <RecordingOverlay
          consentText={consentStatement}
          onClose={() => setShowOverlay(false)}
          onRecordingComplete={handleRecordingComplete}
        />
      )}
    </>
  );
}
