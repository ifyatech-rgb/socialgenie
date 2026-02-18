"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth-fetch";
import { useDashboardStats } from "./dashboard-stats-context";
import { formatTimeAgo } from "@/lib/format-time-ago";

const PENDING_SCRIPT_KEY = "pendingScript";

interface DashboardData {
  hasTrainingVideo: boolean;
  trainingVideoUrl?: string | null;
  avatarStatus?: string | null;
  scriptsCount: number;
  draftScriptsCount?: number;
  finalizedScriptsCount?: number;
  videosCount: number;
  scriptsThisWeek?: number;
  videosThisWeek?: number;
  credits?: number;
  videoCredits?: number;
  genieEdits?: number;
  customAvatarsLimit?: number;
  customAvatarsUsed?: number;
  subscription?: { status: string; duplicatePaymentMethod?: boolean; trialEndsAt?: string | null } | null;
  recentScripts: Array<{
    id: string;
    topic: string;
    platform: string;
    content?: string;
    createdAt: string;
  }>;
  recentVideos?: Array<{
    id: string;
    topic: string;
    platform: string;
    generatedVideoUrl: string | null;
    createdAt: string;
    length: number;
    videoStatus?: string | null;
  }>;
}

interface ActivityItem {
  id: string;
  type: string;
  text: string;
  action: string;
  time: string;
}

function getActivityIcon(type: string): string {
  if (type === "script") return "📝";
  if (type === "video") return "🎬";
  return "✨";
}

function getDaysRemaining(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const days = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setStats } = useDashboardStats();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userName = (session?.user?.name?.split(" ")[0] || "Creator").replace(/\b\w/g, (c) => c.toUpperCase());
  const successToastShown = useRef(false);

  useEffect(() => {
    const success = searchParams?.get("success") === "true";
    if (!success || successToastShown.current) return;
    const showSuccessToast = (d: DashboardData | null) => {
      successToastShown.current = true;
      if (!d?.subscription) {
        toast.success("Subscription started! You have 10 credits. Enjoy your 7-day free trial.");
        return;
      }
      const active = d.subscription.status === "trialing" || d.subscription.status === "active";
      if (active) {
        toast.success("Welcome back! Your subscription is active.");
      } else {
        toast.success("Subscription started! You have 10 credits. Enjoy your 7-day free trial.");
      }
    };
    if (data) {
      showSuccessToast(data);
    } else if (session) {
      authFetch("/api/dashboard", {}, session)
        .then((res) => (res.ok ? res.json() : null))
        .then((d) => {
          if (d) showSuccessToast(d);
          else {
            successToastShown.current = true;
            toast.success("Subscription started! You have 10 credits. Enjoy your 7-day free trial.");
          }
        })
        .catch(() => {
          successToastShown.current = true;
          toast.success("Subscription started! You have 10 credits. Enjoy your 7-day free trial.");
        });
    }
  }, [searchParams, data, session]);

  const fetchDashboardData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authFetch("/api/dashboard", { cache: "no-store" }, session);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setActivities(result.activities ?? []);
        setStats({
          credits: result.videoCredits ?? result.credits ?? 0,
          scriptsCount: result.scriptsCount ?? 0,
          videosCount: result.videosCount ?? 0,
        });
      } else {
        const userRes = await authFetch("/api/user", { cache: "no-store" }, session);
        if (userRes.ok) {
          const { user: u } = await userRes.json();
          const fallback: DashboardData = {
            hasTrainingVideo: false,
            scriptsCount: Number(u?.scriptsCount) || 0,
            videosCount: Number(u?.videosCount) || 0,
            credits: Number(u?.credits) || 0,
            recentScripts: [],
            recentVideos: [],
            subscription: null,
          };
          setData(fallback);
          setStats({ credits: fallback.credits ?? 0, scriptsCount: fallback.scriptsCount, videosCount: fallback.videosCount });
        } else {
          setData(null);
          setStats(null);
        }
      }
    } catch {
      setData(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const credits = data?.credits ?? 0;
  const videoCredits = data?.videoCredits ?? data?.credits ?? 0;
  const genieEdits = data?.genieEdits ?? 0;
  const videosCreated = data?.videosCount ?? 0;
  const scriptsCreated = data?.scriptsCount ?? 0;
  const draftScripts = data?.draftScriptsCount ?? 0;
  const finalizedScripts = data?.finalizedScriptsCount ?? 0;
  const scriptsThisWeek = data?.scriptsThisWeek ?? 0;
  const videosThisWeek = data?.videosThisWeek ?? 0;
  const customAvatarsLimit = data?.customAvatarsLimit ?? 1;
  const customAvatarsUsed = data?.customAvatarsUsed ?? 0;
  const recentScripts = data?.recentScripts ?? [];
  const recentVideos = data?.recentVideos ?? [];
  const subscriptionStatus = data?.subscription?.status;
  const trialEndsAt = data?.subscription?.trialEndsAt ?? null;

  const recentActivity = activities.slice(0, 3).map((a) => ({
    id: a.id,
    icon: getActivityIcon(a.type),
    title: a.text,
    timeAgo: a.time,
  }));

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="h-40 sm:h-48 animate-pulse rounded-2xl bg-white border border-gray-100" />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 sm:h-36 animate-pulse rounded-2xl bg-white border border-gray-100" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 sm:h-24 animate-pulse rounded-2xl bg-white border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
      {data?.subscription?.duplicatePaymentMethod && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="text-sm text-amber-800">
            This payment method is already in use. Please sign in or contact support.
          </span>
          <Link href="/auth/signin" className="shrink-0 font-semibold text-amber-700 hover:text-amber-900">
            Sign in →
          </Link>
        </div>
      )}

      {/* Hero - landing style: bold headline, gradient accent, rounded buttons */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10 lg:items-center lg:min-h-[380px]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="sg-badge sg-animate-fadeIn inline-flex w-fit">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-[sg-pulse-dot_2s_ease-in-out_infinite]" />
            <span className="text-gray-700">Welcome back, {userName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 sg-animate-fadeIn">
            Create Viral Videos
            <span className="block sm:inline bg-gradient-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent"> in Minutes</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg sg-animate-fadeIn">
            AI-powered scripts, avatars, and video generation all in one place.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 sg-animate-fadeIn">
            <Link
              href="/dashboard/generate-script"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all text-base"
            >
              <span>🎬</span>
              <span>Start Creating</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/scripts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all text-base"
            >
              <span>📝</span>
              <span>View Scripts</span>
            </Link>
          </div>
        </div>
        {/* Floating cards - hidden on mobile, visible tablet+ */}
        <div className="relative hidden lg:block h-[300px]">
          <div className="absolute top-6 left-6 bg-white rounded-2xl border border-gray-100 shadow-md flex items-center gap-3 px-5 py-4 sg-animate-float">
            <span className="text-2xl">👥</span>
            <span className="font-bold text-gray-900">100+ UGC Creators</span>
          </div>
          <div className="absolute top-8 right-10 bg-white rounded-2xl border border-gray-100 shadow-md flex items-center gap-3 px-5 py-4 sg-animate-float" style={{ animationDelay: "0.25s" }}>
            <span className="text-2xl">🎭</span>
            <span className="font-bold text-gray-900">500+ Avatars</span>
          </div>
          <div className="absolute top-36 right-10 bg-white rounded-2xl border border-gray-100 shadow-md flex items-center gap-3 px-5 py-4 sg-animate-float" style={{ animationDelay: "0.5s" }}>
            <span className="text-2xl">🎤</span>
            <span className="font-bold text-gray-900">50+ Voices</span>
          </div>
          <div className="absolute bottom-8 left-16 bg-white rounded-2xl border border-gray-100 shadow-md flex items-center gap-3 px-5 py-4 sg-animate-float" style={{ animationDelay: "1s" }}>
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-gray-900">Fast Generation</span>
          </div>
        </div>
      </section>

      {/* Stats Grid - landing style: first card purple-pink, rest white/light with borders */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6 sm:mt-8">
        <Link
          href="/checkout"
          className="group relative bg-gradient-to-br from-purple-600 to-pink-500 p-4 sm:p-6 rounded-2xl text-white overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer block"
        >
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
          <div className="relative z-10 mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl sm:text-3xl">🎬</span>
            </div>
          </div>
          <div className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{videoCredits}</div>
          <p className="relative z-10 text-white/90 text-sm font-medium mb-2 sm:mb-3">Video Credits</p>
          <span className="relative z-10 text-white font-medium text-sm hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
            Get more <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <div className="group relative bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
          <div className="mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🧞‍♂️</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">{genieEdits}</div>
          <p className="text-gray-600 text-sm font-medium mb-1">Genie Edits</p>
          <p className="text-gray-500 text-xs">Script refinements</p>
        </div>

        <Link
          href="/dashboard/scripts"
          className="group relative bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 cursor-pointer block"
        >
          <div className="mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📝</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">{scriptsCreated}</div>
          <p className="text-gray-600 text-sm font-medium mb-2">Scripts</p>
          {draftScripts > 0 && (
            <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mb-1">
              {draftScripts} drafts
            </span>
          )}
          {scriptsThisWeek > 0 && (
            <p className="text-gray-500 text-xs">+{scriptsThisWeek} this week</p>
          )}
          <span className="text-purple-600 font-medium text-sm hover:underline flex items-center gap-1 group-hover:gap-2 transition-all mt-2">
            View all <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <Link
          href="/dashboard/avatars"
          className="group relative bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 cursor-pointer block"
        >
          <div className="mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">✅</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">{videosCreated}</div>
          <p className="text-gray-600 text-sm font-medium mb-2">Videos Created</p>
          {videosThisWeek > 0 && (
            <p className="text-gray-500 text-xs">+{videosThisWeek} this week</p>
          )}
          <span className="text-purple-600 font-medium text-sm hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
            Create video <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <Link
          href={customAvatarsUsed >= customAvatarsLimit ? "/checkout" : "/dashboard/avatars/create"}
          className="group relative bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 cursor-pointer block"
        >
          <div className="mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🎭</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
            {customAvatarsUsed}/{customAvatarsLimit}
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Custom Avatars</p>
          <p className="text-gray-500 text-xs mb-2 sm:mb-3">
            {customAvatarsUsed >= customAvatarsLimit ? "Limit reached" : `${customAvatarsLimit - customAvatarsUsed} remaining`}
          </p>
          <span className="text-purple-600 font-medium text-sm hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
            {customAvatarsUsed >= customAvatarsLimit ? "Upgrade" : "Create avatar"}{" "}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </section>

      {/* Quick Actions - landing style: white cards, purple-pink accent */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
          <Link
            href="/dashboard/scripts"
            className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md hover:border-purple-100 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-purple-50 flex items-center justify-center text-2xl sm:text-3xl">
              ✨
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Generate Script</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Create viral scripts with AI in seconds</p>
            <span className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center text-base opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
          <Link
            href="/dashboard/avatars"
            className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md hover:border-purple-100 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-purple-50 flex items-center justify-center text-2xl sm:text-3xl">
              🎭
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Choose Avatar</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Browse 100+ realistic AI avatars</p>
            <span className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center text-base opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md hover:border-purple-100 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-purple-50 flex items-center justify-center text-2xl sm:text-3xl">
              ⚙️
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Settings</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Manage your account preferences</p>
            <span className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center text-base opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
        </div>
      </section>

      {/* Recent Scripts + Recent Videos - landing style */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">📝 Recent Scripts</h2>
            <Link href="/dashboard/scripts" className="text-sm font-semibold text-purple-600 hover:text-pink-500 transition-colors">
              View all →
            </Link>
          </div>
          {recentScripts.length === 0 ? (
            <div className="py-8 sm:py-10 text-center">
              <span className="text-4xl sm:text-5xl opacity-40">📝</span>
              <p className="mt-3 font-semibold text-gray-600">No scripts yet</p>
              <Link
                href="/dashboard/scripts"
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full text-sm shadow-md hover:shadow-lg transition-all"
              >
                Generate your first script
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:border-purple-100 hover:bg-purple-50/50"
                >
                  <span className="text-xl sm:text-2xl shrink-0">
                    {script.platform === "TikTok" ? "🎵" : script.platform === "Instagram" ? "📸" : "▶️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {script.topic?.substring(0, 50) || "Untitled Script"}
                      {script.topic && script.topic.length > 50 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="sg-badge text-xs py-0.5 px-2">{script.platform}</span>
                      <span>{formatTimeAgo(script.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          PENDING_SCRIPT_KEY,
                          JSON.stringify({
                            scriptId: script.id,
                            script: script.content ?? "",
                            topic: script.topic ?? "",
                            platform: script.platform,
                          })
                        );
                        router.push("/dashboard/avatars");
                      } catch {
                        toast.error("Could not load script");
                      }
                    }}
                    className="shrink-0 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-lg transition-colors hover:border-purple-300 hover:bg-purple-50"
                  >
                    🎬
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">🎬 Recent Videos</h2>
            <Link href="/dashboard/avatars" className="text-sm font-semibold text-purple-600 hover:text-pink-500 transition-colors">
              View all →
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <div className="py-8 sm:py-10 text-center">
              <span className="text-4xl sm:text-5xl opacity-40">🎬</span>
              <p className="mt-3 font-semibold text-gray-600">No videos yet</p>
              <Link
                href="/dashboard/avatars"
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full text-sm shadow-md hover:shadow-lg transition-all"
              >
                Create your first video
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentVideos.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:border-purple-100 hover:bg-purple-50/50"
                >
                  <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {v.generatedVideoUrl ? (
                      <video
                        src={v.generatedVideoUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl sm:text-2xl">🎥</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {v.topic?.substring(0, 50) || "Untitled Video"}
                      {v.topic && v.topic.length > 50 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-semibold",
                          v.videoStatus === "completed" && "bg-emerald-100 text-emerald-700",
                          (v.videoStatus === "processing" || v.videoStatus === "pending") && "bg-amber-100 text-amber-700",
                          v.videoStatus === "failed" && "bg-red-100 text-red-700",
                          !["completed", "processing", "pending", "failed"].includes(v.videoStatus ?? "") && "bg-gray-100 text-gray-600"
                        )}
                      >
                        {v.videoStatus === "completed"
                          ? "✅ Ready"
                          : v.videoStatus === "processing" || v.videoStatus === "pending"
                          ? "⏳ Processing"
                          : v.videoStatus === "failed"
                          ? "❌ Failed"
                          : v.videoStatus || ""}
                      </span>
                      <span className="text-gray-500">{formatTimeAgo(v.createdAt)}</span>
                    </div>
                  </div>
                  {v.videoStatus === "completed" && v.generatedVideoUrl && (
                    <a
                      href={v.generatedVideoUrl}
                      download
                      className="shrink-0 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-lg transition-colors hover:border-purple-300 hover:bg-purple-50"
                    >
                      📥
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low credits warning */}
      {videoCredits <= 2 && videoCredits >= 0 && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5">
          <span className="text-2xl sm:text-3xl">⚠️</span>
          <div className="flex-1 min-w-0">
            <strong className="block text-amber-800">Low on video credits!</strong>
            <p className="text-sm text-amber-700">
              You have {videoCredits} video credit(s) remaining. Get more to keep creating videos.
            </p>
          </div>
          <Link
            href="/checkout"
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-amber-600 font-bold text-white hover:bg-amber-700 transition-colors"
          >
            Get More Credits
          </Link>
        </div>
      )}
    </div>
  );
}
