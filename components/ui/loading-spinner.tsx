"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

export function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={cn("absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 blur-lg opacity-50", sizeClasses[size])} />
        <Loader2 className={cn("animate-spin text-purple-600 relative z-10", sizeClasses[size])} />
      </div>
      {text && <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
