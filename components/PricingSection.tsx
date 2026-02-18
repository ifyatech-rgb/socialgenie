"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Creator",
      description: "Perfect for getting started",
      monthlyPrice: 39,
      yearlyPrice: 33,
      features: [
        "20 Video Credits / month",
        "Unlimited AI Script Generation",
        "50 Genie Script Edits",
        "500+ AI Avatars",
        "5 Custom Avatars",
        "720p Export",
        "Max 90 sec per video",
      ],
      buttonText: "Get Started",
      highlighted: false,
      href: "/checkout",
    },
    {
      name: "Professional",
      description: "For serious creators",
      monthlyPrice: 79,
      yearlyPrice: 67,
      features: [
        "50 Video Credits / month",
        "Everything in Creator plan",
        "150 Genie Edits",
        "100+ UGC Avatars",
        "1080p HD Export",
        "Priority Rendering",
        "Max 2 min per video",
      ],
      buttonText: "Get Started",
      highlighted: true,
      badge: "Most Popular",
      href: "/checkout",
    },
    {
      name: "Enterprise",
      description: "For teams and agencies",
      monthlyPrice: 199,
      yearlyPrice: 169,
      features: [
        "150 Video Credits / month",
        "Everything in Professional",
        "500 Genie Edits",
        "Team Collaboration",
        "API Access",
        "White Label Option",
        "4K Export",
        "Max 3-5 min per video",
      ],
      buttonText: "Contact Sales",
      highlighted: false,
      href: "/pricing",
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 via-purple-100/30 to-purple-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Simple Pricing
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-2">
            Choose Your Plan <span className="text-2xl">✨⭐️</span>
          </p>
          <p className="text-lg sm:text-xl text-gray-600 mb-8">
            Start creating viral videos today
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isYearly
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bill yearly{" "}
              <span className="text-xs font-bold text-pink-500">-15%</span>
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !isYearly
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bill monthly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-8 transition-all hover:shadow-xl ${
                plan.highlighted
                  ? "border-2 border-purple-600 shadow-lg shadow-purple-100/50"
                  : "border border-gray-200 shadow-lg"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {plan.badge}
                </div>
              )}

              {/* Plan Name */}
              <div className="text-sm font-medium text-gray-600 mb-2">
                {plan.name}
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-base text-gray-600">/month</span>
                </div>
                {isYearly && (
                  <div className="text-xs text-gray-500 mt-1">
                    Billed annually (${plan.yearlyPrice * 12}/year)
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={`block w-full px-6 py-3 rounded-full text-base font-semibold text-center transition-all ${
                  plan.highlighted
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-900 hover:bg-black text-white"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-12">
          All plans include 7-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
