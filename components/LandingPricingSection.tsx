"use client";

import { useRouter } from "next/navigation";

const CREDIT_TIERS = [
  { duration: "0-60 sec", credits: "1 credit" },
  { duration: "1-2 min", credits: "2 credits" },
  { duration: "2-3 min", credits: "3 credits" },
  { duration: "3-4 min", credits: "4 credits" },
  { duration: "4-5 min", credits: "5 credits" },
];

export default function LandingPricingSection() {
  const router = useRouter();

  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#faf9fe]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Choose the plan that fits your content creation needs
          </p>
        </div>

        {/* Credit Explanation */}
        <div className="rounded-2xl border-[3px] border-purple-500 bg-gradient-to-br from-indigo-100 to-purple-100 p-6 sm:p-10 mb-12 lg:mb-16 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-purple-900 mb-3">
            💳 How Credits Work
          </h3>
          <p className="text-base font-semibold text-purple-800 mb-8">
            No video length limits! Credits scale with your video duration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {CREDIT_TIERS.map((tier) => (
              <div
                key={tier.duration}
                className="flex items-center gap-3 bg-white px-5 py-4 rounded-xl shadow-md border border-purple-100"
              >
                <span className="font-bold text-purple-900 text-sm whitespace-nowrap">
                  {tier.duration}
                </span>
                <span className="text-purple-500 font-medium">→</span>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3.5 py-1.5 rounded-full font-bold text-sm whitespace-nowrap">
                  {tier.credits}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {/* Free Trial Card */}
          <div className="relative rounded-2xl border-[3px] border-emerald-500 bg-gradient-to-b from-emerald-50 to-white p-8 sm:p-10 transition-all hover:-translate-y-2 hover:shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-6 rounded-full font-bold text-xs uppercase tracking-wide">
              ✨ Start Free
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 mb-4">
              7-Day Free Trial
            </h3>
            <div className="mb-8">
              <span className="text-4xl sm:text-5xl font-black text-gray-900">$0</span>
              <span className="text-lg text-gray-600 font-semibold ml-2">for 7 days</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <strong className="text-gray-900">10 FREE Credits</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600">✓</span>5 Genie Script Edits
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600">✓</span>Create videos of any length
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600">✓</span>500+ AI Avatars
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600">✓</span>720p Export
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-emerald-600">✓</span>All features unlocked
              </li>
              <li className="flex items-center gap-2 text-gray-700 pb-0">
                <span className="text-emerald-600">✓</span>No credit card required
              </li>
            </ul>
            <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3.5 mb-6 text-center text-sm font-bold text-sky-900">
              📊 Make: 10× 1-min OR 5× 2-min videos
            </div>
            <button
              type="button"
              onClick={() => router.push("/auth/signup")}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start Free Trial →
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              No payment required • Cancel anytime
            </p>
          </div>

          {/* Creator Plan Card */}
          <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 sm:p-10 transition-all hover:-translate-y-2 hover:shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
              Creator
            </h3>
            <div className="mb-8">
              <span className="text-4xl sm:text-5xl font-black text-gray-900">$39</span>
              <span className="text-lg text-gray-600 font-semibold ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600 font-bold">✓</span>
                <strong className="text-gray-900">20 Video Credits</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>50 Genie Script Edits
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>Unlimited video length
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>1 Custom Avatar
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>500+ AI Avatars
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>100+ UGC Creators
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-indigo-600">✓</span>720p Export
              </li>
              <li className="flex items-center gap-2 text-gray-700 pb-0">
                <span className="text-indigo-600">✓</span>AI Script Generation
              </li>
            </ul>
            <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3.5 mb-6 text-center text-sm font-bold text-sky-900">
              📊 Make: 20× 1-min OR 10× 2-min OR 6× 3-min videos
            </div>
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Creator →
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Cancel anytime • No hidden fees
            </p>
          </div>

          {/* Professional Plan Card - Featured */}
          <div className="relative rounded-2xl border-[3px] border-purple-500 bg-white p-8 sm:p-10 shadow-xl shadow-purple-200/40 transition-all hover:-translate-y-2 hover:shadow-2xl lg:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-5 rounded-full font-bold text-xs uppercase tracking-wide">
              ⭐ Most Popular
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 mb-4">
              Professional
            </h3>
            <div className="mb-8">
              <span className="text-4xl sm:text-5xl font-black text-gray-900">$79</span>
              <span className="text-lg text-gray-600 font-semibold ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600 font-bold">✓</span>
                <strong className="text-gray-900">50 Video Credits</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>150 Genie Script Edits
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>Unlimited video length
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>5 Custom Avatars
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>Everything in Creator
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>1080p HD Export
              </li>
              <li className="flex items-center gap-2 text-gray-700 border-b border-gray-100 pb-3">
                <span className="text-purple-600">✓</span>Priority Rendering
              </li>
              <li className="flex items-center gap-2 text-gray-700 pb-0">
                <span className="text-purple-600">✓</span>Priority Support
              </li>
            </ul>
            <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3.5 mb-6 text-center text-sm font-bold text-sky-900">
              📊 Make: 50× 1-min OR 25× 2-min OR 10× 5-min videos
            </div>
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Professional →
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Cancel anytime • No contracts
            </p>
          </div>
        </div>

        {/* Pricing Footer Note */}
        <div className="text-center pt-10 border-t-2 border-gray-200">
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            ✨ All plans include unlimited AI script generation, multi-platform
            support, and auto-generated captions
          </p>
        </div>
      </div>
    </section>
  );
}
