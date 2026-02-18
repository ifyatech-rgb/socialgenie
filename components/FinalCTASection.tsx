"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinalCTASection() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch {
      // best-effort
    }
    router.push("/auth/signup");
  };

  const avatarData = [
    { src: "https://i.pravatar.cc/150?img=1", initials: "SC", gradient: "from-purple-400 to-purple-600" },
    { src: "https://i.pravatar.cc/150?img=2", initials: "MR", gradient: "from-pink-400 to-pink-600" },
    { src: "https://i.pravatar.cc/150?img=3", initials: "LP", gradient: "from-blue-400 to-blue-600" },
    { src: "https://i.pravatar.cc/150?img=4", initials: "JW", gradient: "from-green-400 to-green-600" },
    { src: "https://i.pravatar.cc/150?img=5", initials: "ET", gradient: "from-orange-400 to-orange-600" },
  ];

  return (
    <section className="py-12 sm:py-14 lg:py-16 px-4 bg-slate-800">
      <div className="max-w-4xl mx-auto text-center">
        {/* Heading - single line */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight whitespace-nowrap">
          <span className="text-white">Ready to </span>
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Go Viral?</span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 mb-6 max-w-2xl mx-auto">
          Get access. Be first to clone yourself.
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-6 py-4 rounded-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all hover:scale-105"
            >
              Try for Free
            </button>
          </div>
        </form>

        {/* Social Proof with Avatar Images */}
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <div className="flex -space-x-2">
            {avatarData.map(({ src, initials, gradient }) => (
              <div
                key={initials}
                className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden flex-shrink-0 bg-slate-700"
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  className={`hidden w-full h-full absolute inset-0 bg-gradient-to-br ${gradient} items-center justify-center text-white text-xs font-bold`}
                >
                  {initials}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm">
            10,247 creators have already joined
          </p>
        </div>
      </div>
    </section>
  );
}
