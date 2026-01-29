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

  const paddingClasses = {
    sm: "py-12 sm:py-16",
    md: "py-16 sm:py-20",
    lg: "py-20 sm:py-24 lg:py-32",
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
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
