"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
];

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <nav
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between rounded-full bg-white/90 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md border border-white/80 sm:px-6 lg:h-14 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo href="/" size={36} showText rounded="2xl" />
        </div>

        {/* Desktop nav links - purple on hover */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Sign In (black pill) + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px]"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu - dropdown below pill, purple hover */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-0.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/auth/signin"
              className="mt-2 rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 transition-colors min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
