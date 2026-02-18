"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** Logo file in public/logos/ – used for favicon, navbar, dashboard, etc. */
export const LOGO_SRC = "/logos/logo.png"

interface LogoProps {
  size?: number
  showText?: boolean
  href?: string
  className?: string
  variant?: "default" | "light"
  /** Use rounded-2xl for landing/dashboard style (default: rounded-lg) */
  rounded?: "lg" | "2xl"
}

export function Logo({ size = 40, showText = false, href = "/dashboard", className = "", variant = "default", rounded = "lg" }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 sm:gap-3 group ${className}`}>
      <div 
        className={cn(
          "relative flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 overflow-hidden shadow-md",
          rounded === "2xl" ? "rounded-2xl" : "rounded-lg",
          variant === "light" && "drop-shadow-[0_0_12px_rgba(147,51,234,0.4)]"
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
            "font-bold truncate text-lg sm:text-xl lg:text-2xl",
            variant === "light" ? "text-white font-semibold" : "text-gray-900"
          )}
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
