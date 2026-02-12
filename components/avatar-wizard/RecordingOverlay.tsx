"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface RecordingOverlayProps {
  consentText: string;
  onClose: () => void;
  onRecordingComplete: (blob: Blob, durationSeconds?: number) => void;
}

export function RecordingOverlay({
  consentText,
  onClose,
  onRecordingComplete,
}: RecordingOverlayProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [talking, setTalking] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          onRecordingComplete(blob, elapsedRef.current);
        };

        recorder.start(1000);
        setRecording(true);

        timerRef.current = setInterval(() => {
          setElapsed((e) => {
            const next = e + 1;
            elapsedRef.current = next;
            return next;
          });
        }, 1000);
      } catch (err) {
        console.error("Recording start failed", err);
      }
    };

    start();
    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current?.state !== "inactive") {
        recorderRef.current?.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onRecordingComplete]);

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setRecording(false);
    onClose();
  };

  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-label="Recording consent"
    >
      <div className="absolute inset-0 bg-[url('/blur-bg.jpg')] bg-cover bg-center opacity-30 blur-2xl" />
      <div className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-4">
          <div
            className="flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white"
            aria-live="polite"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>
              {mm}:{ss}
            </span>
            <span>{talking ? "Talking" : "Recording"}</span>
            <span className="opacity-80">🔄</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close recording"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="max-w-2xl text-center text-2xl font-medium leading-relaxed text-white drop-shadow-lg md:text-3xl">
            {consentText}
          </p>
        </div>
      </div>
    </div>
  );
}
