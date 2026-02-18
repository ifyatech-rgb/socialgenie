"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

const PLAN_KEYS = ["creator", "professional", "enterprise"] as const;

const planIcons = {
  creator: <Zap className="w-6 h-6" />,
  professional: <Sparkles className="w-6 h-6" />,
  enterprise: <Rocket className="w-6 h-6" />,
};

export function CreativePricing() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 min-w-0">
      <div className="text-center space-y-6 mb-16">
        <div className="text-xl text-[#667eea] font-bold">Simple Pricing</div>
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Choose Your Plan
            <div className="absolute -right-12 top-0 text-[#764ba2] rotate-12">✨</div>
            <div className="absolute -left-8 bottom-0 text-[#667eea] -rotate-12">⭐️</div>
          </h2>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-[#667eea]/20 rotate-[-1deg] rounded-full blur-sm" />
        </div>
        <p className="text-xl text-gray-400">Start creating viral videos today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLAN_KEYS.map((key, index) => {
          const plan = PLANS[key];
          const popular = "badge" in plan && plan.badge;
          return (
            <div
              key={key}
              className={cn(
                "relative group transition-all duration-300 flex flex-col",
                index === 0 && "md:rotate-[-1deg]",
                index === 1 && "md:rotate-[1deg]",
                index === 2 && "md:rotate-[-2deg]"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-[#1a1a1a]",
                  "border-2",
                  popular ? "border-[#667eea]" : "border-[#2a2a2a]",
                  "rounded-lg shadow-[4px_4px_0px_0px]",
                  popular ? "shadow-[#667eea]" : "shadow-[#2a2a2a]",
                  "transition-all duration-300",
                  "group-hover:shadow-[8px_8px_0px_0px]",
                  "group-hover:translate-x-[-4px]",
                  "group-hover:translate-y-[-4px]"
                )}
              />

              <div className="relative p-6 flex flex-col flex-1 min-h-0">
                {popular && "badge" in plan && plan.badge && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-3 py-1 rounded-full rotate-12 text-sm border-2 border-white">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mb-4 flex items-center justify-center border-2",
                      popular ? "border-[#667eea] bg-[#667eea]/10" : "border-[#2a2a2a]"
                    )}
                    style={{ color: popular ? "#667eea" : "#9ca3af" }}
                  >
                    {planIcons[key]}
                  </div>
                  <h3 className="text-2xl text-white font-bold">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {key === "creator" && "Perfect for getting started"}
                    {key === "professional" && "For serious creators"}
                    {key === "enterprise" && "For teams and agencies"}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-[#667eea] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#667eea]" />
                      </div>
                      <span className="text-sm text-gray-300 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mt-auto pt-2">
                  <Link href={key === "enterprise" ? "/auth/signup?plan=enterprise" : `/auth/signup?plan=${key}`} className="block">
                    <Button
                      fullWidth
                      className={cn(
                        "w-full h-12 text-lg relative border-2 transition-all duration-300",
                        "shadow-[4px_4px_0px_0px]",
                        "hover:shadow-[6px_6px_0px_0px]",
                        "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                        popular
                          ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-[#667eea] shadow-[#667eea] hover:opacity-95"
                          : "bg-[#0a0a0a] text-white border-[#2a2a2a] shadow-[#2a2a2a] hover:bg-[#1a1a1a]"
                      )}
                    >
                      {key === "enterprise" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </Link>
                  <Link
                    href={`/auth/signup?plan=${key}`}
                    className="block text-center text-sm font-medium text-[#667eea] hover:text-[#764ba2] transition-colors"
                  >
                    Get a free trial
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
