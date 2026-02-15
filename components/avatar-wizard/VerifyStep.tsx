"use client";

import { VideoPlayer } from "./VideoPlayer";
import { useOptionalAvatarCreation } from "@/contexts/AvatarCreationContext";

interface VerifyStepProps {
  mainVideoUrl: string;
  consentVideoUrl: string;
  userName: string;
  mainFileName?: string;
  mainFileSize?: string;
  mainDuration?: string;
  consentDuration?: string;
  consentSize?: string;
  /** When "photo", main media is shown as image instead of video. */
  mediaType?: "photo" | "video";
}

export function VerifyStep({
  mainVideoUrl: propsMainVideoUrl,
  consentVideoUrl: propsConsentVideoUrl,
  userName: propsUserName,
  mainFileName: propsMainFileName = "Main video",
  mainFileSize: propsMainFileSize,
  mainDuration: propsMainDuration,
  consentDuration: propsConsentDuration,
  consentSize: propsConsentSize,
  mediaType = "video",
}: VerifyStepProps) {
  const ctx = useOptionalAvatarCreation();
  const mainVideoUrl = ctx?.mainVideoUrl ?? propsMainVideoUrl;
  const consentVideoUrl = ctx?.consentVideoUrl ?? propsConsentVideoUrl;
  const userName = ctx?.userName ?? propsUserName;
  const mainFileName = ctx?.mainVideoFileName || propsMainFileName;
  const mainFileSize = ctx?.mainVideoSize ?? propsMainFileSize;
  const mainDuration = ctx?.mainVideoDuration ?? propsMainDuration;
  const consentDuration = ctx?.consentDuration ?? propsConsentDuration;
  const consentSize = ctx?.consentSize ?? propsConsentSize;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-center text-[32px] font-bold text-[#000000]">
        Verify your videos
      </h1>
      <p className="mb-8 text-center text-base text-[#6B7280]">
        Review your main footage and consent recording before creating your avatar.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Main Video Section */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden>{mediaType === "photo" ? "📸" : "🎥"}</span>
              <h2 className="text-xl font-bold text-[#000000]">
                {mediaType === "photo" ? "Your photo" : "Your main video"}
              </h2>
            </div>
            <span className="rounded-full bg-purple-600 px-4 py-1 text-sm font-medium text-white">
              {mediaType === "photo" ? "PHOTO" : "MAIN VIDEO"}
            </span>
          </div>

          <div className="mb-4 overflow-hidden rounded-lg bg-black">
            {mainVideoUrl ? (
              mediaType === "photo" ? (
                <img
                  src={mainVideoUrl}
                  alt="Uploaded photo"
                  className="mx-auto max-h-[400px] w-full object-contain"
                />
              ) : (
                <VideoPlayer
                  src={mainVideoUrl}
                  aria-label="Main footage"
                  className="w-full"
                />
              )
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gray-900 text-white">
                {mediaType === "photo" ? "No photo loaded" : "No video loaded"}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span aria-hidden>📁</span>
              <span>{mainFileName}</span>
            </div>
            {mainDuration != null && (
              <div className="flex items-center gap-2">
                <span aria-hidden>⏱️</span>
                <span>{mainDuration}</span>
              </div>
            )}
            {mainFileSize != null && (
              <div className="flex items-center gap-2">
                <span aria-hidden>📊</span>
                <span>{mainFileSize}</span>
              </div>
            )}
          </div>
        </div>

        {/* Consent Video Section */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden>✅</span>
              <h2 className="text-xl font-bold text-[#000000]">Consent video</h2>
            </div>
            <span className="rounded-full bg-green-600 px-4 py-1 text-sm font-medium text-white">
              LIVE CONSENT
            </span>
          </div>

          <div className="mb-4 overflow-hidden rounded-lg bg-black">
            {consentVideoUrl ? (
              <VideoPlayer
                src={consentVideoUrl}
                aria-label="Consent recording"
                className="w-full"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gray-900 text-white">
                No consent video
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span aria-hidden>📹</span>
              <span>Live consent recording</span>
            </div>
            {consentDuration != null && (
              <div className="flex items-center gap-2">
                <span aria-hidden>⏱️</span>
                <span>{consentDuration}</span>
              </div>
            )}
            {consentSize != null && (
              <div className="flex items-center gap-2">
                <span aria-hidden>📊</span>
                <span>{consentSize}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {userName && (
        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Submitting as <strong className="text-[#374151]">{userName}</strong>
        </p>
      )}
    </div>
  );
}
