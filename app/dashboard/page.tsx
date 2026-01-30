"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Video,
  Check,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  hasTrainingVideo: boolean;
  trainingVideoUrl?: string;
  scriptsCount: number;
  videosCount: number;
  recentScripts: Array<{
    id: string;
    topic: string;
    platform: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name?.split(" ")[0] || "Creator";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Step statuses
  const step1Complete = data?.hasTrainingVideo || false;
  const step2Complete = (data?.scriptsCount || 0) > 0;
  const step3Unlocked = step1Complete && step2Complete;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-violet-100 text-base sm:text-lg">
          Create viral content in 3 simple steps. Let's get started!
        </p>
      </motion.div>

      {/* 3-Step Process */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Step 1: Create Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={cn(
            "relative bg-white rounded-2xl border-2 p-6 h-full transition-all",
            step1Complete 
              ? "border-green-200 bg-green-50/30" 
              : "border-violet-200 hover:border-violet-400 hover:shadow-lg"
          )}>
            {/* Step Number */}
            <div className={cn(
              "absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg",
              step1Complete
                ? "bg-green-500 text-white"
                : "bg-violet-600 text-white"
            )}>
              {step1Complete ? <Check className="h-5 w-5" /> : "1"}
            </div>

            {/* Icon */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
              step1Complete ? "bg-green-100" : "bg-violet-100"
            )}>
              <Upload className={cn(
                "h-7 w-7",
                step1Complete ? "text-green-600" : "text-violet-600"
              )} />
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Create Your Avatar
            </h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Upload a photo or video of yourself. We'll create an AI clone that looks and sounds like you.
            </p>

            {/* Status */}
            <div className="mb-4">
              {step1Complete ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  <span>Avatar created</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Not started yet</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Link href="/dashboard/avatar" className="block">
              <button className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                step1Complete
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200"
              )}>
                {step1Complete ? "View Avatar" : "Create Now"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Step 2: Generate Script */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={cn(
            "relative bg-white rounded-2xl border-2 p-6 h-full transition-all",
            step2Complete
              ? "border-green-200 bg-green-50/30"
              : "border-gray-200 hover:border-violet-400 hover:shadow-lg"
          )}>
            {/* Step Number */}
            <div className={cn(
              "absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg",
              step2Complete
                ? "bg-green-500 text-white"
                : "bg-violet-600 text-white"
            )}>
              {step2Complete ? <Check className="h-5 w-5" /> : "2"}
            </div>

            {/* Icon */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
              step2Complete ? "bg-green-100" : "bg-violet-100"
            )}>
              <FileText className={cn(
                "h-7 w-7",
                step2Complete ? "text-green-600" : "text-violet-600"
              )} />
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Generate Script
            </h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Tell us your topic and our AI will write a viral script optimized for your chosen platform.
            </p>

            {/* Status */}
            <div className="mb-4">
              {step2Complete ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  <span>{data?.scriptsCount} scripts created</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Ready to generate</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Link href="/dashboard/generate-script" className="block">
              <button className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                step2Complete
                  ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                  : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200"
              )}>
                {step2Complete ? "Create Another" : "Create Script"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Step 3: Generate Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={cn(
            "relative bg-white rounded-2xl border-2 p-6 h-full transition-all",
            !step3Unlocked
              ? "border-gray-200 bg-gray-50/50"
              : "border-gray-200 hover:border-violet-400 hover:shadow-lg"
          )}>
            {/* Step Number */}
            <div className={cn(
              "absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg",
              !step3Unlocked
                ? "bg-gray-300 text-gray-500"
                : "bg-violet-600 text-white"
            )}>
              {!step3Unlocked ? <Lock className="h-4 w-4" /> : "3"}
            </div>

            {/* Icon */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
              !step3Unlocked ? "bg-gray-100" : "bg-violet-100"
            )}>
              <Video className={cn(
                "h-7 w-7",
                !step3Unlocked ? "text-gray-400" : "text-violet-600"
              )} />
            </div>

            {/* Content */}
            <h3 className={cn(
              "text-lg font-bold mb-2",
              !step3Unlocked ? "text-gray-400" : "text-gray-900"
            )}>
              Generate Video
            </h3>
            <p className={cn(
              "text-sm mb-4 leading-relaxed",
              !step3Unlocked ? "text-gray-400" : "text-gray-500"
            )}>
              Create a video with your AI clone speaking your script. Download and post on any platform.
            </p>

            {/* Status */}
            <div className="mb-4">
              {!step3Unlocked ? (
                <div className="flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 px-3 py-2 rounded-lg">
                  <Lock className="h-4 w-4" />
                  <span>
                    {!step1Complete 
                      ? "Upload training video first" 
                      : "Create a script first"}
                  </span>
                </div>
              ) : (data?.videosCount || 0) > 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  <span>{data?.videosCount} videos created</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-violet-600 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Ready to create videos!</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {step3Unlocked ? (
              <Link href="/dashboard/generate-video" className="block">
                <button className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2">
                  Create Video
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : (
              <button 
                disabled
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Complete Steps Above
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Work Section */}
      {(data?.recentScripts?.length || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Work</h2>
            <div className="space-y-3">
              {data?.recentScripts?.slice(0, 5).map((script) => (
                <Link
                  key={script.id}
                  href={`/dashboard/scripts/${script.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{script.topic}</p>
                      <p className="text-sm text-gray-500">{script.platform}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-violet-600 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State - Show only if no activity */}
      {!loading && !step1Complete && !step2Complete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to go viral?
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Start by uploading a training video, or jump straight to generating your first script!
          </p>
        </motion.div>
      )}
    </div>
  );
}
