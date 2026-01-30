"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Use minimal header (logo + nav) or full navbar. Default: true (full navbar) */
  variant?: "default" | "minimal";
  /** Optional class for the inner container */
  containerClassName?: string;
}

export function Header({
  className,
  variant = "default",
  containerClassName,
  children,
  ...props
}: HeaderProps) {
  if (variant === "minimal") {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6",
            containerClassName
          )}
        >
          {children ?? (
            <>
              <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="text-lg">Voxara</span>
              </Link>
            </>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={cn("relative w-full", className)} {...props}>
      {children ?? <Navbar />}
    </header>
  );
}

export default Header;
