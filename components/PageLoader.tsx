"use client";

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = "Loading...", className = "" }: PageLoaderProps) {
  return (
    <div
      className={
        "flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-50 to-white " +
        className
      }
    >
      <Loader2 className="h-12 w-12 animate-spin text-purple-600" aria-hidden />
      <p className="text-sm font-semibold text-gray-600">{message}</p>
    </div>
  );
}
