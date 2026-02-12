"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
};
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MIN_DURATION_SEC = 30;
const MAX_DURATION_SEC = 5 * 60;

export interface UploadedFile {
  file: File;
  url: string;
}

interface UploadZoneProps {
  onUpload: (file: UploadedFile) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({
  onUpload,
  disabled = false,
  className,
}: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

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
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      if (first?.errors?.[0]?.code === "file-too-large") {
        setError("File must be under 2GB");
      } else if (first?.errors?.[0]?.code === "file-invalid-type") {
        setError("Please use MP4 or MOV");
      } else {
        setError("Invalid file. Use MP4 or MOV, 30 sec – 5 min, up to 2GB.");
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
        aria-label="Upload footage"
      >
        <input {...getInputProps()} aria-hidden />
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#E5E7EB]">
          <Upload className="h-7 w-7 text-[#6B7280]" aria-hidden />
        </div>
        <p className="text-base font-medium text-[#000000]">Upload footage</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          30 sec - 5 mins, MP4, MOV, up to 2GB
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
