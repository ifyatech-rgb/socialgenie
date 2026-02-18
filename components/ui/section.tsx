"use client";

import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: "white" | "light" | "dark" | "gradient"
  padding?: "sm" | "md" | "lg"
  id?: string
}

export function Section({ 
  children, 
  className, 
  background = "white",
  padding = "lg",
  id 
}: SectionProps) {
  const bgClasses = {
    white: "bg-white",
    light: "bg-slate-50",
    dark: "text-white",
    gradient: "text-white",
  }

  /* Mobile-first section padding */
  const paddingClasses = {
    sm: "pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20",
    md: "pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24",
    lg: "section-padding",
  }

  // Use inline styles for custom backgrounds
  const bgStyles: Record<string, React.CSSProperties> = {
    dark: { backgroundColor: "#0F172A" },
    gradient: { background: "linear-gradient(to bottom right, #6366F1, #8B5CF6, #EC4899)" },
  }

  return (
    <section 
      id={id}
      style={bgStyles[background]}
      className={cn(
        bgClasses[background],
        paddingClasses[padding],
        "w-full min-w-0 max-w-full",
        className
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto w-full min-w-0 max-w-full box-border",
        padding === "lg" ? "" : "px-4 sm:px-6 lg:px-10 xl:px-12"
      )}>
        {children}
      </div>
    </section>
  )
}
