"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadMode = "photo" | "video";

const VIDEO_ACCEPT = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
};
const PHOTO_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};
const VIDEO_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedFile {
  file: File;
  url: string;
}

interface UploadZoneProps {
  onUpload: (file: UploadedFile) => void;
  mode?: UploadMode;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({
  onUpload,
  mode = "video",
  disabled = false,
  className,
}: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const isPhoto = mode === "photo";
  const accept = isPhoto ? PHOTO_ACCEPT : VIDEO_ACCEPT;
  const maxSize = isPhoto ? PHOTO_MAX_SIZE : VIDEO_MAX_SIZE;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onUpload({ file, url });
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      if (first?.errors?.[0]?.code === "file-too-large") {
        setError(isPhoto ? "Image must be under 10MB" : "File must be under 2GB");
      } else if (first?.errors?.[0]?.code === "file-invalid-type") {
        setError(isPhoto ? "Please use JPG or PNG" : "Please use MP4 or MOV");
      } else {
        setError(
          isPhoto
            ? "Invalid file. Use JPG or PNG, up to 10MB."
            : "Invalid file. Use MP4 or MOV, 30 sec – 5 min, up to 2GB."
        );
      }
    },
  });

  return (
    <div className={cn("", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white py-16 transition-colors",
          "border-[#CCCCCC] hover:border-[#6B7280] hover:bg-[#F9FAFB]",
          isDragActive && "border-[#6B7280] bg-[#F5F5F5]",
          disabled && "cursor-not-allowed opacity-60"
        )}
        style={{ padding: 60 }}
        aria-label={isPhoto ? "Upload photo" : "Upload footage"}
      >
        <input {...getInputProps()} aria-hidden />
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#E5E7EB]">
          <Upload className="h-7 w-7 text-[#6B7280]" aria-hidden />
        </div>
        <p className="text-base font-medium text-[#000000]">
          {isPhoto ? "Upload photo" : "Upload footage"}
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">
          {isPhoto ? "JPG, PNG, up to 10MB" : "30 sec - 5 mins, MP4, MOV, up to 2GB"}
        </p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
