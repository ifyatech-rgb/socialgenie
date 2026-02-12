"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  videosCount: number;
  scriptsThisWeek?: number;
  videosThisWeek?: number;
  credits?: number;
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
    const success = searchParams.get("success") === "true";
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

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    if (!session) {
      if (isInitial) setLoading(false);
      return;
    }
    try {
      if (isInitial) setLoading(true);
      const [dashboardRes, activityRes] = await Promise.all([
        authFetch("/api/dashboard", {}, session),
        authFetch("/api/activity?limit=10", {}, session),
      ]);
      if (dashboardRes.ok) {
        const result = await dashboardRes.json();
        setData(result);
        setStats({
          credits: result.credits ?? 0,
          scriptsCount: result.scriptsCount ?? 0,
          videosCount: result.videosCount ?? 0,
        });
      } else {
        setData(null);
        setStats(null);
      }
      if (activityRes.ok) {
        const result = await activityRes.json();
        setActivities(result.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setData(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Re-fetch when user returns to this tab so numbers stay in sync
  useEffect(() => {
    const onFocus = () => fetchDashboardData(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchDashboardData]);

  // Poll every 30s for live stats when tab is visible
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchDashboardData(false);
    }, 30000);
    return () => clearInterval(id);
  }, [session, fetchDashboardData]);

  const credits = data?.credits ?? 0;
  const videosCreated = data?.videosCount ?? 0;
  const scriptsCreated = data?.scriptsCount ?? 0;
  const scriptsThisWeek = data?.scriptsThisWeek ?? 0;
  const videosThisWeek = data?.videosThisWeek ?? 0;
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
      <div className="flex flex-col gap-8">
        <div className="h-48 animate-pulse rounded-[20px] bg-[var(--sg-bg-tertiary)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-[20px] bg-[var(--sg-bg-tertiary)]" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[20px] bg-[var(--sg-bg-tertiary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--sg-2xl)]">
      {data?.subscription?.duplicatePaymentMethod && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--sg-radius-xl)] border border-amber-300 bg-amber-50 p-4"
        >
          <span className="text-sm text-amber-800">
            This payment method is already in use. Please sign in or contact support.
          </span>
          <Link href="/auth/signin" className="shrink-0 font-semibold text-amber-700 hover:text-amber-900">
            Sign in →
          </Link>
        </motion.div>
      )}

      {/* Hero Section - Framer style */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center lg:min-h-[420px]">
        <div className="flex flex-col gap-6">
          <div className="sg-badge sg-animate-fadeIn inline-flex w-fit">
            <span className="w-2 h-2 rounded-full bg-[var(--sg-secondary)] animate-[sg-pulse-dot_2s_ease-in-out_infinite]" />
            <span>Welcome back, {userName}</span>
          </div>
          <h1 className="sg-heading-1 text-[var(--sg-text-primary)] sg-animate-fadeIn">
            Create Viral Videos
            <span className="sg-text-gradient"> in Minutes</span>
          </h1>
          <p className="text-[var(--sg-font-size-xl)] text-[var(--sg-text-secondary)] leading-relaxed max-w-lg sg-animate-fadeIn">
            AI-powered scripts, avatars, and video generation all in one place.
          </p>
          <div className="flex flex-wrap gap-4 sg-animate-fadeIn">
            <Link
              href="/dashboard/generate-script"
              className="sg-btn sg-btn-primary"
            >
              <span>🎬</span>
              <span>Start Creating</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/scripts"
              className="sg-btn sg-btn-secondary"
            >
              <span>📝</span>
              <span>View Scripts</span>
            </Link>
          </div>
        </div>
        {/* Floating cards - hidden on small screens */}
        <div className="relative hidden lg:block h-[320px]">
          <div className="absolute top-8 left-8 sg-card flex items-center gap-3 px-6 py-4 sg-animate-float">
            <span className="text-3xl">🎭</span>
            <span className="font-bold text-[var(--sg-text-primary)]">100+ Avatars</span>
          </div>
          <div className="absolute top-40 right-12 sg-card flex items-center gap-3 px-6 py-4 sg-animate-float" style={{ animationDelay: "0.5s" }}>
            <span className="text-3xl">🎤</span>
            <span className="font-bold text-[var(--sg-text-primary)]">50+ Voices</span>
          </div>
          <div className="absolute bottom-12 left-20 sg-card flex items-center gap-3 px-6 py-4 sg-animate-float" style={{ animationDelay: "1s" }}>
            <span className="text-3xl">⚡</span>
            <span className="font-bold text-[var(--sg-text-primary)]">Fast Generation</span>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="sg-grid grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sg-card p-6 sm:p-8 text-center cursor-default">
          <div className="text-4xl sm:text-5xl mb-3">📝</div>
          <div className="text-3xl sm:text-4xl font-black bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-transparent mb-1">
            {scriptsCreated}
          </div>
          <div className="text-sm font-semibold text-[var(--sg-text-secondary)]">Scripts Generated</div>
          {scriptsThisWeek > 0 && (
            <p className="mt-2 text-xs font-bold text-emerald-600">+{scriptsThisWeek} this week</p>
          )}
          <Link href="/dashboard/scripts" className="mt-3 inline-block text-sm font-bold text-[#667eea] hover:text-[#764ba2]">
            View all →
          </Link>
        </div>
        <div className="sg-card p-6 sm:p-8 text-center cursor-default">
          <div className="text-4xl sm:text-5xl mb-3">🎬</div>
          <div className="text-3xl sm:text-4xl font-black bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-transparent mb-1">
            {videosCreated}
          </div>
          <div className="text-sm font-semibold text-[var(--sg-text-secondary)]">Videos Created</div>
          {videosThisWeek > 0 && (
            <p className="mt-2 text-xs font-bold text-emerald-600">+{videosThisWeek} this week</p>
          )}
          <Link href="/dashboard/avatars" className="mt-3 inline-block text-sm font-bold text-[#667eea] hover:text-[#764ba2]">
            Create video →
          </Link>
        </div>
        <div className="sg-card p-6 sm:p-8 text-center cursor-default">
          <div className="text-4xl sm:text-5xl mb-3">💎</div>
          <div className="text-3xl sm:text-4xl font-black bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-transparent mb-1">
            {credits}
          </div>
          <div className="text-sm font-semibold text-[var(--sg-text-secondary)]">Credits Left</div>
          {subscriptionStatus === "trialing" && trialEndsAt && (
            <p className="mt-2 text-xs font-bold text-amber-600">{getDaysRemaining(trialEndsAt)} days left</p>
          )}
          <Link href="/checkout" className="mt-3 inline-block text-sm font-bold text-[#667eea] hover:text-[#764ba2]">
            Get more →
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="sg-heading-3 text-[var(--sg-text-primary)] mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/dashboard/scripts"
            className="sg-card p-6 sm:p-8 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="w-16 h-16 rounded-[var(--sg-radius-lg)] bg-[linear-gradient(135deg,rgba(102,126,234,0.12)_0%,rgba(118,75,162,0.12)_100%)] flex items-center justify-center text-3xl">
              ✨
            </div>
            <h3 className="text-xl font-extrabold text-[var(--sg-text-primary)]">Generate Script</h3>
            <p className="text-[var(--sg-text-secondary)] leading-relaxed">Create viral scripts with AI in seconds</p>
            <span className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white flex items-center justify-center text-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
          <Link
            href="/dashboard/avatars"
            className="sg-card p-6 sm:p-8 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="w-16 h-16 rounded-[var(--sg-radius-lg)] bg-[linear-gradient(135deg,rgba(102,126,234,0.12)_0%,rgba(118,75,162,0.12)_100%)] flex items-center justify-center text-3xl">
              🎭
            </div>
            <h3 className="text-xl font-extrabold text-[var(--sg-text-primary)]">Choose Avatar</h3>
            <p className="text-[var(--sg-text-secondary)] leading-relaxed">Browse 100+ realistic AI avatars</p>
            <span className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white flex items-center justify-center text-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="sg-card p-6 sm:p-8 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="w-16 h-16 rounded-[var(--sg-radius-lg)] bg-[linear-gradient(135deg,rgba(102,126,234,0.12)_0%,rgba(118,75,162,0.12)_100%)] flex items-center justify-center text-3xl">
              ⚙️
            </div>
            <h3 className="text-xl font-extrabold text-[var(--sg-text-primary)]">Settings</h3>
            <p className="text-[var(--sg-text-secondary)] leading-relaxed">Manage your account preferences</p>
            <span className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white flex items-center justify-center text-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </Link>
        </div>
      </section>

      {/* Recent Scripts + Recent Videos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="sg-card p-6">
          <div className="flex items-center justify-between border-b border-[var(--sg-border)] pb-4 mb-4">
            <h2 className="text-lg font-bold text-[var(--sg-text-primary)]">📝 Recent Scripts</h2>
            <Link href="/dashboard/scripts" className="text-sm font-bold text-[#667eea] hover:text-[#764ba2]">
              View all →
            </Link>
          </div>
          {recentScripts.length === 0 ? (
            <div className="py-10 text-center">
              <span className="text-5xl opacity-40">📝</span>
              <p className="mt-3 font-semibold text-[var(--sg-text-secondary)]">No scripts yet</p>
              <Link
                href="/dashboard/scripts"
                className="mt-2 inline-block sg-btn sg-btn-primary text-sm"
              >
                Generate your first script
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center gap-3 rounded-[var(--sg-radius-lg)] border border-[var(--sg-border)] bg-[var(--sg-bg-secondary)]/50 p-3 transition-colors hover:border-[#667eea]/40 hover:bg-[rgba(102,126,234,0.06)]"
                >
                  <span className="text-2xl">
                    {script.platform === "TikTok" ? "🎵" : script.platform === "Instagram" ? "📸" : "▶️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--sg-text-primary)]">
                      {script.topic?.substring(0, 50) || "Untitled Script"}
                      {script.topic && script.topic.length > 50 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--sg-text-secondary)]">
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
                    className="shrink-0 rounded-[var(--sg-radius-md)] border-2 border-[var(--sg-border)] bg-white px-3 py-2 text-lg transition-colors hover:border-[#667eea]/50 hover:bg-[rgba(102,126,234,0.08)]"
                  >
                    🎬
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sg-card p-6">
          <div className="flex items-center justify-between border-b border-[var(--sg-border)] pb-4 mb-4">
            <h2 className="text-lg font-bold text-[var(--sg-text-primary)]">🎬 Recent Videos</h2>
            <Link href="/dashboard/avatars" className="text-sm font-bold text-[#667eea] hover:text-[#764ba2]">
              View all →
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <div className="py-10 text-center">
              <span className="text-5xl opacity-40">🎬</span>
              <p className="mt-3 font-semibold text-[var(--sg-text-secondary)]">No videos yet</p>
              <Link
                href="/dashboard/avatars"
                className="mt-2 inline-block sg-btn sg-btn-primary text-sm"
              >
                Create your first video
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVideos.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-[var(--sg-radius-lg)] border border-[var(--sg-border)] bg-[var(--sg-bg-secondary)]/50 p-3 transition-colors hover:border-[#667eea]/40 hover:bg-[rgba(102,126,234,0.06)]"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--sg-radius-md)] bg-[var(--sg-bg-tertiary)]">
                    {v.generatedVideoUrl ? (
                      <video
                        src={v.generatedVideoUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🎥</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--sg-text-primary)]">
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
                          : v.videoStatus || "—"}
                      </span>
                      <span className="text-[var(--sg-text-secondary)]">{formatTimeAgo(v.createdAt)}</span>
                    </div>
                  </div>
                  {v.videoStatus === "completed" && v.generatedVideoUrl && (
                    <a
                      href={v.generatedVideoUrl}
                      download
                      className="shrink-0 rounded-[var(--sg-radius-md)] border-2 border-[var(--sg-border)] bg-white px-3 py-2 text-lg transition-colors hover:border-[#667eea]/50 hover:bg-[rgba(102,126,234,0.08)]"
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
      {credits <= 2 && credits >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 rounded-[var(--sg-radius-2xl)] border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5"
        >
          <span className="text-3xl">⚠️</span>
          <div className="flex-1">
            <strong className="block text-amber-800">Low on credits!</strong>
            <p className="text-sm text-amber-700">
              You have {credits} credits remaining. Get more to keep creating.
            </p>
          </div>
          <Link
            href="/checkout"
            className="sg-btn rounded-[var(--sg-radius-xl)] bg-amber-600 px-5 py-2.5 font-bold text-white hover:bg-amber-700 hover:translate-y-0"
          >
            Get More Credits
          </Link>
        </motion.div>
      )}
    </div>
  );
}
