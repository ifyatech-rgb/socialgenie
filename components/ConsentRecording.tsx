"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ConsentRecordingProps {
  /** User's actual name for script and verification */
  userName: string;
  /** Optional: when user edits their name in the consent script */
  onUserNameChange?: (name: string) => void;
  /** Called with blob and whether name was verified. Only proceed when verified is true. */
  onComplete: (videoBlob: Blob, verified: boolean) => void;
  /** Optional: when user clicks Back (e.g. from instructions) */
  onBack?: () => void;
}

const DEFAULT_SCRIPT_NAME = "Your Name";
const CONSENT_SCRIPT_TEMPLATE = `I, {{name}}, grant permission to use my likeness to create an AI avatar. I understand this avatar will be used to generate videos on the SocialGenie platform. I confirm I am the person in this video and have the legal right to provide this consent.`;

export function ConsentRecording({ userName, onUserNameChange, onComplete, onBack }: ConsentRecordingProps) {
  const [step, setStep] = useState<"instructions" | "recording" | "verification">("instructions");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"pending" | "success" | "failed">("pending");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = userName?.trim() || DEFAULT_SCRIPT_NAME;
  const consentScript = CONSENT_SCRIPT_TEMPLATE.replace("{{name}}", displayName);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please grant camera and microphone permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step === "recording") startCamera();
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const verifyName = useCallback(
    async (videoBlob: Blob) => {
      setVerifying(true);
      setVerificationResult("pending");
      const expectedName = userName?.trim() || displayName;
      try {
        const formData = new FormData();
        formData.append("video", videoBlob);
        formData.append("expectedName", expectedName);
        const res = await fetch("/api/verify-consent", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (data.verified) {
          setVerificationResult("success");
          setTimeout(() => onComplete(videoBlob, true), 2000);
        } else {
          setVerificationResult("failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setVerificationResult("failed");
      } finally {
        setVerifying(false);
      }
    },
    [userName, displayName, onComplete]
  );

  const startCountdown = () => {
    setCountdown(3);
    let count = 3;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : 0);
      if (count <= 0) {
        clearInterval(countInterval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setIsRecording(false);
      stopCamera();
      setStep("verification");
      verifyName(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(200);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 30) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopCamera, stopRecording, verifyName]);

  const retakeRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setVerificationResult("pending");
    setStep("recording");
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Instructions step
  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Consent Video Instructions
            </h1>
            <p className="text-gray-600 text-lg">Please read carefully before recording</p>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-purple-900">You Will Read This Script:</h3>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
              <p className="text-gray-800 leading-relaxed text-lg font-medium flex flex-wrap items-baseline gap-1">
                I,&nbsp;
                {onUserNameChange ? (
                  <input
                    type="text"
                    value={userName.trim()}
                    onChange={(e) => onUserNameChange(e.target.value)}
                    placeholder="Your Name"
                    className="inline-block min-w-[140px] max-w-[280px] rounded-lg border-2 border-purple-300 bg-purple-50/50 px-3 py-1.5 text-lg font-semibold text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    aria-label="Your name in the consent script"
                  />
                ) : (
                  <strong>{displayName}</strong>
                )}
                , grant permission to use my likeness to create an AI avatar. I understand this avatar will be used to generate videos on the SocialGenie platform. I confirm I am the person in this video and have the legal right to provide this consent.
              </p>
            </div>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Important:</p>
                  <p className="text-yellow-800 text-sm">
                    You MUST say your name &quot;<strong>{displayName}</strong>&quot; exactly as shown above. Our system will verify your name. If it doesn&apos;t match, your avatar will be rejected.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Look at the Camera</h4>
                <p className="text-blue-800 text-sm">Keep your face visible and look directly at the camera throughout the recording.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Read the Script Clearly</h4>
                <p className="text-green-800 text-sm">The script will appear on screen. Read it slowly and clearly, especially your name.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">Name Verification</h4>
                <p className="text-purple-800 text-sm">After recording, we&apos;ll verify you said &quot;{displayName}&quot; correctly. If not verified, you&apos;ll need to retake.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("recording")}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" />
            </svg>
            I Understand, Start Recording
          </button>
        </div>
      </div>
    );
  }

  // Recording step: medium-sized camera, consent below video, controls below consent (no overlap)
  if (step === "recording") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header + Back + REC indicator */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setStep("instructions");
              }}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="font-semibold">REC {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Camera feed - medium size, not fullscreen */}
            <div className="flex justify-center mb-6">
              <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-white text-8xl sm:text-9xl font-bold animate-pulse">{countdown}</div>
                  </div>
                )}
                {cameraReady && !isRecording && countdown === null && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Camera Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Consent script - below video, fully visible, no overlap */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                      Read This Script Clearly:
                    </h3>
                    <div className="bg-white rounded-xl p-4 border border-yellow-200">
                      <p className="text-gray-800 leading-relaxed text-base">
                        {consentScript}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Recording tips:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Speak clearly and say your name &quot;{displayName}&quot; exactly as shown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Keep your face well-lit and centered</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Minimum 30 seconds (max ~60 seconds)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Recording controls - below consent, centered */}
            <div className="flex justify-center">
              {!isRecording && countdown === null && cameraReady ? (
                <button
                  type="button"
                  onClick={startCountdown}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                  Start Recording
                </button>
              ) : isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-black text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="w-4 h-4 bg-white" />
                  Stop Recording
                </button>
              ) : null}
            </div>

            {/* Camera error - full message, no overlay on video */}
            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 border-2 border-red-200 p-6 text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-lg font-semibold text-red-800 mb-2">Camera access required</p>
                <p className="text-red-700 mb-4">{error}</p>
                <button type="button" onClick={startCamera} className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700">
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Verification step
  if (step === "verification") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          {verifying && (
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifying Your Name...</h2>
              <p className="text-gray-600">Please wait while we verify you said &quot;{displayName}&quot; in the video</p>
            </div>
          )}

          {!verifying && verificationResult === "success" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Verification Successful!</h2>
              <p className="text-gray-600 mb-6">Your name was verified correctly. Creating your avatar...</p>
              <div className="animate-pulse text-purple-600 font-semibold">Processing...</div>
            </div>
          )}

          {!verifying && verificationResult === "failed" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-2">We couldn&apos;t verify that you said &quot;{displayName}&quot; in the recording.</p>
              <p className="text-gray-600 mb-6">Please try again and make sure to say your name clearly.</p>
              <div className="flex gap-4">
                <button type="button" onClick={onBack} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="button" onClick={retakeRecording} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold">
                  Record Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default ConsentRecording;
