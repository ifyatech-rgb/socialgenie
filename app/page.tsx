"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import LandingNavbar from "@/components/LandingNavbar";
import PricingSection from "@/components/PricingSection";
import FinalCTASection from "@/components/FinalCTASection";
import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ComparisonSection from "@/components/ComparisonSection";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-purple-50/30 to-gray-50">
      <LandingNavbar />
      <HeroSection />

      {/* Feature Ticker - below hero */}
      <div className="relative overflow-hidden border-y border-gray-100 bg-white/50 py-3">
        <div className="flex animate-scroll whitespace-nowrap">
          <div className="flex gap-8 px-4">
            <span className="text-sm font-medium text-gray-600">🎬 500+ AI Avatars</span>
            <span className="text-sm font-medium text-gray-600">👥 100+ UGC Creators</span>
            <span className="text-sm font-medium text-gray-600">📝 Research-Backed Viral Scripts</span>
            <span className="text-sm font-medium text-gray-600">⚡ Publish in Under 5 Minutes</span>
            <span className="text-sm font-medium text-gray-600">🌍 Multi-Platform Distribution</span>
          </div>
          <div className="flex gap-8 px-4">
            <span className="text-sm font-medium text-gray-600">🎬 500+ AI Avatars</span>
            <span className="text-sm font-medium text-gray-600">👥 100+ UGC Creators</span>
            <span className="text-sm font-medium text-gray-600">📝 Research-Backed Viral Scripts</span>
            <span className="text-sm font-medium text-gray-600">⚡ Publish in Under 5 Minutes</span>
            <span className="text-sm font-medium text-gray-600">🌍 Multi-Platform Distribution</span>
          </div>
        </div>
      </div>

      {/* ========== PROBLEMS (dark blue) ========== */}
      <ProblemsSection />

      {/* ========== HOW IT WORKS (zigzag + purple cards) ========== */}
      <HowItWorksSection />

      {/* ========== COMPARISON (dark blue) ========== */}
      <ComparisonSection />

      {/* ========== STATS ========== */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#FAF9FE] to-[#F5F3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            Join 10,000+ Creators
            <br />
            Going Viral Daily
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "10,247", label: "Active Creators" },
              { value: "2.4M", label: "Videos Created" },
              { value: "847M", label: "Total Views" },
              { value: "4.9★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { quote: "I went from 2K to 150K followers in 90 days using SocialGenie. The competitor analysis is insane!", name: "Sarah Chen", title: "Fitness Coach", stat: "+148K followers", initials: "SC" },
              { quote: "Made $12K in my first month. The AI scripts are better than what I could write myself.", name: "Mike Rodriguez", title: "Business Coach", stat: "$12K revenue", initials: "MR" },
              { quote: "4.2M views on one video. Mind blown! This is the future of content creation.", name: "Lisa Park", title: "Tech Reviewer", stat: "4.2M views", initials: "LP" },
            ].map((t) => (
              <div key={t.initials} className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
                <p className="text-gray-700 mb-6 leading-relaxed">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.title}</div>
                    <div className="text-sm font-semibold text-purple-600">{t.stat}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-br from-[#FAF9FE] to-[#F5F3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4 sm:mb-6">
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">to Dominate Your Niche</span>
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 sm:mb-16">
            AI scripts, avatars, voices, and video generation in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { badge: "AI-Powered", title: "AI Script Generation", desc: "Generate viral scripts with AI, optimized for TikTok, Instagram Reels, and YouTube Shorts." },
              { badge: "Project Management", title: "Project Management", desc: "Track all your videos in one place. Edit scripts, regenerate videos, manage your content library." },
              { badge: "HeyGen Powered", title: "100+ Realistic AI Avatars", desc: "Choose from diverse AI avatars with natural expressions. Create videos without being on camera." },
              { badge: "One Click", title: "Multi-Platform Formats", desc: "Optimized for YouTube Shorts (9:16), TikTok, Instagram Reels. Perfect dimensions every time." },
              { badge: "Global Reach", title: "Natural AI Voices", desc: "50+ voices in multiple languages. No robotic sound, just natural narration for your videos." },
              { badge: "Always Improving", title: "Fast Video Generation", desc: "Videos ready in 2-3 minutes. Real-time progress tracking until your video is ready to download." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-4">
                  {f.badge}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING (Framer-inspired) ========== */}
      <PricingSection />

      {/* ========== FAQ ========== */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#FAF9FE] to-[#F5F3FF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "When will SocialGenie launch?", a: "SocialGenie is live now! Sign up and start creating videos immediately." },
              { q: "Can I change plans later?", a: "Yes! You can upgrade or downgrade your plan at any time from your dashboard." },
              { q: "Do I own the videos?", a: "Absolutely! You have full commercial rights to all videos you create." },
              { q: "What's the refund policy?", a: "We offer a 7-day money-back guarantee. If you're not satisfied, we'll refund you in full." },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA (dark blue) ========== */}
      <FinalCTASection />

      {/* ========== FOOTER ========== */}
      <footer className="bg-white border-t border-gray-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo href="/" size={36} showText rounded="2xl" />
              </div>
              <p className="text-sm text-gray-600 max-w-sm">
                Your Partner to Go Viral - Complete AI Video Platform. Scripts, avatars, voices, and video generation in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="#features" className="block text-sm text-gray-600 hover:text-gray-900">Features</Link>
                <Link href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-gray-600 hover:text-gray-900">About</Link>
                <Link href="/contact" className="block text-sm text-gray-600 hover:text-gray-900">Contact</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">© {new Date().getFullYear()} SocialGenie. All rights reserved.</p>
              <p className="text-sm text-gray-500">Made with ❤️ for creators worldwide</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
