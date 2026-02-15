"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import NeuralBackground from "./flow-field-background";

export default function NeuralHero() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Animated Background with Purple Corner Gradients */}
      <div className="absolute inset-0 z-0">
        <NeuralBackground
          color="#A78BFA"
          trailOpacity={0.15}
          particleCount={200}
          speed={0.5}
          className="absolute inset-0 bg-white"
        />

        {/* Purple Gradient Overlays in Corners - NOT mixed with white */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Left Purple Glow */}
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px]" />
          {/* Top Right Violet Glow */}
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[120px]" />
          {/* Bottom Left Purple Accent */}
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-purple-300/15 rounded-full blur-[100px]" />
          {/* Bottom Right Violet Accent */}
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-violet-300/15 rounded-full blur-[100px]" />
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-900 px-4">
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.8s ease-out forwards;
            opacity: 0;
          }
          .delay-200 {
            animation-delay: 0.2s;
          }
          .delay-400 {
            animation-delay: 0.4s;
          }
          .delay-600 {
            animation-delay: 0.6s;
          }
          .delay-800 {
            animation-delay: 0.8s;
          }
        `}</style>

        {/* Trust Badge with Social Proof */}
        <div className="mb-8 animate-fade-in-down">
          <div className="flex items-center gap-2 px-6 py-3 bg-purple-100/80 backdrop-blur-md border border-purple-300/40 rounded-full text-sm shadow-lg shadow-purple-200/50">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-purple-800 font-semibold">
              🔥 10,000+ creators building viral brands with SocialGenie
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 bg-clip-text text-transparent animate-fade-in-up delay-200 leading-tight">
              Create Viral Videos
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent animate-fade-in-up delay-400 leading-tight">
              in Minutes
            </h1>
          </div>

          {/* Subtitle - Mobile Optimized */}
          <div className="max-w-3xl mx-auto animate-fade-in-up delay-600">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 font-light leading-relaxed px-4">
              Generate AI scripts, choose from 100+ avatars, and create professional videos instantly. No editing skills required.
            </p>
          </div>

          {/* CTA Buttons - Mobile Stacked */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10 animate-fade-in-up delay-800 px-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2"
              >
                <span>🎬</span> Start Creating Free
              </button>
            </Link>
            <button
              type="button"
              onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/80 hover:bg-white border-2 border-purple-600/30 hover:border-purple-600/60 text-purple-700 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg shadow-purple-200/50 flex items-center justify-center gap-2"
            >
              Watch Demo <span>▶️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
