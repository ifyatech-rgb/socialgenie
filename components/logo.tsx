"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

const LOGO_SRC = "/logos/logo.png"

interface LogoProps {
  size?: number
  showText?: boolean
  href?: string
  className?: string
  variant?: "default" | "light"
}

export function Logo({ size = 40, showText = false, href = "/dashboard", className = "", variant = "default" }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div 
        className={cn(
          "relative flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg overflow-hidden",
          variant === "light" && "drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]"
        )}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <Image
          src={LOGO_SRC}
          alt="SocialGenie Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span 
          className={cn(
            "text-xl font-bold",
            variant === "light" ? "text-white font-semibold" : "bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent"
          )}
          style={{ fontSize: size * 0.5 }}
        >
          SocialGenie
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    )
  }

  return content
}

// Export a simple logo icon for places where just the image is needed
export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <Image
        src={LOGO_SRC}
        alt="SocialGenie Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}
