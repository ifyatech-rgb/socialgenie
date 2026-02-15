"use client";

import { useAvatarCreation } from "@/contexts/AvatarCreationContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function VerifyAvatarPage() {
  const router = useRouter();
  const {
    mainVideoFile,
    mainVideoUrl,
    mainVideoFileName,
    mainVideoDuration,
    mainVideoSize,
    consentVideoBlob,
    consentVideoUrl,
    consentDuration,
    consentSize,
    userName,
  } = useAvatarCreation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!mainVideoFile || !consentVideoBlob) {
      setError("Please upload both main video and consent video");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("mainVideo", mainVideoFile);
      formData.append("consentVideo", consentVideoBlob, "consent.webm");
      formData.append("userName", userName);

      const response = await fetch("/api/avatars/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("dashboard-refresh", Date.now().toString());
          window.dispatchEvent(new CustomEvent("dashboard-refresh"));
        }
        router.push("/dashboard/avatars?success=true");
      } else {
        setError(data.error || "Failed to create avatar");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to create avatar. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" aria-hidden>🎉</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            Ready to Create Your Avatar!
          </h1>
          <p className="text-gray-600">
            Review your submissions below and click Submit to start processing.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>🎥</span>
                <h2 className="text-xl font-bold">Your Main Video</h2>
              </div>
              <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                MAIN VIDEO
              </span>
            </div>

            <div className="bg-black rounded-xl overflow-hidden mb-4">
              {mainVideoUrl ? (
                <video
                  key={mainVideoUrl}
                  controls
                  className="w-full aspect-video"
                  src={mainVideoUrl}
                  onError={(e) => console.error("Main video load error:", e)}
                >
                  <source src={mainVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center text-white">
                  <p className="text-lg mb-2">⚠️ No video loaded</p>
                  <p className="text-sm text-gray-400">Please go back and upload a video</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>📁</span>
                <span className="text-gray-700">{mainVideoFileName || "No file"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>⏱️</span>
                <span className="text-gray-700">{mainVideoDuration || "0:00"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>📊</span>
                <span className="text-gray-700">{mainVideoSize || "0 MB"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>✅</span>
                <h2 className="text-xl font-bold">Consent Video</h2>
              </div>
              <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                LIVE CONSENT
              </span>
            </div>

            <div className="bg-black rounded-xl overflow-hidden mb-4">
              {consentVideoUrl ? (
                <video key={consentVideoUrl} controls className="w-full aspect-video" src={consentVideoUrl}>
                  <source src={consentVideoUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video flex items-center justify-center text-white">
                  ⚠️ No consent video
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>📹</span>
                <span className="text-gray-700">Live consent recording</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>⏱️</span>
                <span className="text-gray-700">{consentDuration || "0:00"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl" aria-hidden>📊</span>
                <span className="text-gray-700">{consentSize || "0 MB"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>👤</span>
              <span className="text-gray-600">Your Name:</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              {userName || "Not provided"}
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <Link
            href="/dashboard/avatars/create"
            className="px-8 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back
          </Link>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !mainVideoUrl || !consentVideoUrl}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Avatar...
              </>
            ) : (
              <>
                Submit & Create Avatar
                <span aria-hidden>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
