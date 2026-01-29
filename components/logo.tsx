"use client"

import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: number
  showText?: boolean
  href?: string
  className?: string
}

export function Logo({ size = 40, showText = false, href = "/dashboard", className = "" }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div 
        className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logos/logo.png"
          alt="Voxara Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span 
          className="text-xl font-bold bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent"
          style={{ fontSize: size * 0.5 }}
        >
          Voxara
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
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logos/logo.png"
        alt="Voxara Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}
