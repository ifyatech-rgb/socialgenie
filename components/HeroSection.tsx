"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /** Submit email to waitlist API then redirect to signup - KEEP existing backend behavior */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch {
      // Best-effort: still redirect even if waitlist fails
    }
    router.push("/auth/signup");
  };

  /** Existing OAuth flow - KEEP */
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <section className="relative min-h-[100dvh] lg:min-h-0 flex flex-col py-6 sm:py-10 lg:py-10 xl:py-14 px-4 overflow-hidden">
      {/* Subtle background effects - spec */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-pink-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col justify-center max-w-5xl mx-auto text-center w-full">
        {/* Social Proof Badge - compact margin on mobile so Google button stays in viewport */}
        <div className="flex justify-center mb-3 sm:mb-5 lg:mb-5">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 py-2 sm:px-5 sm:py-3 shadow-sm border border-gray-100">
            <div className="flex -space-x-1.5 sm:-space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/150?img=${i + 10}`}
                  alt=""
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              Join{" "}
              <span className="font-bold text-purple-600">10,000+ creators</span>{" "}
              already ahead
            </p>
          </div>
        </div>

        {/* Laptop: tighter so "Join with Google" is fully visible above the fold */}
        <div className="space-y-5 sm:space-y-6 lg:space-y-5 xl:space-y-7 2xl:space-y-8">
          {/* Headline - smaller on laptop so Google button fits in viewport */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-[80px] font-bold leading-[1.1] tracking-tight px-2 sm:px-4">
            <span className="text-gray-900">Your Partner to </span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Go Viral!
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto px-2 sm:px-4">
            We research your topic, generate viral scripts, and create professional videos with{" "}
            <span className="font-semibold text-gray-900">100+ UGC creators</span>.
          </p>

          {/* CTA - form + divider + Google; compact on laptop so button fully visible */}
          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 lg:space-y-3 px-2 sm:px-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Mobile: stacked, full width; email input with icon like reference */}
              <div className="md:hidden flex flex-col gap-3 w-full">
                <div className="relative w-full">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-5 py-4 text-base text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm disabled:opacity-70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-base font-semibold rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Try for Free
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Desktop: side by side, input 400px with icon */}
              <div className="hidden md:flex flex-row gap-3 items-center justify-center">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    disabled={loading}
                    className="w-[400px] pl-12 pr-7 py-4 text-base text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm disabled:opacity-70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-base font-semibold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 whitespace-nowrap min-h-[56px]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Try for Free
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider - compact on laptop so Google button fully in viewport */}
            <div className="flex items-center gap-4 max-w-md mx-auto my-3 sm:my-5 lg:my-3">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-500 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Join with Google - PURE BLACK per spec */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-black hover:bg-gray-900 text-white text-base font-semibold rounded-full shadow-md hover:shadow-lg transition-all min-h-[56px]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Join with Google</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
