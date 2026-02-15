"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Video, Square, Check, AlertTriangle, Info, FileText, Zap } from "lucide-react";

interface ConsentRecordingProps {
  /** Called when user submits the recording. */
  onComplete: (videoBlob: Blob) => void;
  /** Optional: name to show in consent script (e.g. "I, John, grant..."). */
  userName?: string;
  /** Optional: called when user clicks Back. */
  onBack?: () => void;
}

const HEYGEN_CONSENT_SCRIPT = `I, [Your Name], grant permission to use my likeness to create an AI avatar. I understand this avatar will be used to generate videos on the SocialGenie platform. I confirm I am the person in this video and have the legal right to provide this consent.`;

export function ConsentRecording({ onComplete, userName, onBack }: ConsentRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const consentScript = userName?.trim()
    ? HEYGEN_CONSENT_SCRIPT.replace("[Your Name]", userName)
    : HEYGEN_CONSENT_SCRIPT;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please grant camera and microphone permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(200);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const startCountdown = () => {
    setCountdown(3);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : null);
      if (count <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        startRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const submitRecording = () => {
    if (recordedBlob) onComplete(recordedBlob);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Back
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Record consent video</h1>
        <p className="mt-1 text-gray-600">
          Read the consent statement clearly while looking at the camera
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Camera preview + controls */}
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-900">
            {recordedUrl ? (
              <video
                src={recordedUrl}
                controls
                playsInline
                className="h-full w-full object-cover"
                aria-label="Recorded consent video"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                aria-label="Live camera preview"
              />
            )}

            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <span className="text-8xl font-bold text-white animate-pulse tabular-nums">
                  {countdown}
                </span>
              </div>
            )}

            {isRecording && (
              <div className="absolute left-4 top-4 flex items-center gap-3 rounded-full bg-red-600 px-4 py-2 text-white">
                <span className="h-3 w-3 rounded-full bg-white animate-pulse" aria-hidden />
                <span className="font-semibold tabular-nums">REC {formatTime(recordingTime)}</span>
              </div>
            )}

            {cameraReady && !isRecording && countdown === null && !recordedUrl && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-white">
                <span className="h-3 w-3 rounded-full bg-white" aria-hidden />
                <span className="font-semibold">Camera ready</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 p-6 text-center text-white">
                <AlertTriangle className="mb-4 h-16 w-16 shrink-0" aria-hidden />
                <p className="text-lg font-semibold">Camera access required</p>
                <p className="mt-2 text-sm opacity-95">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!recordedBlob ? (
              <>
                {!isRecording && countdown === null ? (
                  <button
                    type="button"
                    onClick={startCountdown}
                    disabled={!cameraReady || !!error}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    <Video className="h-6 w-6" aria-hidden />
                    Start recording
                  </button>
                ) : isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-4 text-lg font-semibold text-white transition-colors hover:bg-gray-900"
                  >
                    <Square className="h-6 w-6" aria-hidden />
                    Stop recording
                  </button>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white">
                    Get ready… {countdown}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={retakeRecording}
                  className="flex-1 rounded-xl bg-gray-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={submitRecording}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <Check className="h-6 w-6" aria-hidden />
                  Use this recording
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Instructions + consent script */}
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                <Info className="h-6 w-6 text-white" aria-hidden />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-lg text-blue-900">Recording instructions</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    Position yourself in front of the camera with good lighting
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    Look directly at the camera while speaking
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    Read the consent statement clearly and at a moderate pace
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">4.</span>
                    Replace &quot;[Your Name]&quot; with your actual full name
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">5.</span>
                    Recording should be about 15–30 seconds
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600">
                <FileText className="h-6 w-6 text-white" aria-hidden />
              </div>
              <h3 className="font-bold text-xl text-purple-900">Read this script</h3>
            </div>
            <div className="rounded-xl border-2 border-purple-100 bg-white p-6">
              <p className="text-lg font-medium leading-relaxed text-gray-800">
                {consentScript}
              </p>
            </div>
            <div className="mt-4 flex gap-3 text-sm text-purple-800">
              <Info className="h-5 w-5 shrink-0 text-purple-600" aria-hidden />
              <p>
                <strong>Important:</strong> This consent is required by HeyGen to create your AI
                avatar. Your video will only be used to generate your personal avatar on this
                platform.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-lg text-emerald-900">
              <Zap className="h-5 w-5 text-emerald-600" aria-hidden />
              Pro tips
            </h3>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li>• Ensure your face is well-lit and clearly visible</li>
              <li>• Speak naturally — don’t rush through the script</li>
              <li>• Make sure there’s no background noise</li>
              <li>• You can retake as many times as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsentRecording;
