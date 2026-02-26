"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Home,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Coins,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearScriptVideoContext } from "@/lib/script-video-context-storage";
import { Logo, LogoIcon } from "@/components/logo";
import { UpgradePopup, type UpgradePopupUser } from "@/components/UpgradePopup";
import { DashboardStatsProvider } from "./dashboard-stats-context";
import { CreditsProvider } from "./credits-context";

// Simplified navigation - only 5 items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/dashboard/avatars", label: "Avatars", icon: User },
  { href: "/dashboard/generate-script", label: "Generate Script", icon: FileText },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [dashboardUser, setDashboardUser] = useState<UpgradePopupUser | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const upgradePopupShownRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Single fetch for user credits; dedupe and debounce to avoid 5 to 6 duplicate /api/user calls
  const lastFetchRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DEDUPE_MS = 20_000; // Max once per 20 sec to avoid constant refresh
  const DEBOUNCE_MS = 2000;

  const fetchUser = useCallback(async () => {
    if (status !== "authenticated") return;
    const now = Date.now();
    if (now - lastFetchRef.current < DEDUPE_MS) return;
    lastFetchRef.current = now;
    try {
      const res = await fetch("/api/user", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setCredits(u?.videoCredits ?? u?.credits ?? 0);
        if (u?.onboardingCompleted === false) {
          router.replace("/onboarding");
          return;
        }
        const paymentStatus = u?.payment_status;
        if (paymentStatus === "pending") {
          router.replace("/pricing");
          return;
        }
        setDashboardUser({
          videoCredits: u?.videoCredits ?? u?.credits,
          genieEdits: u?.genieEdits,
          plan: u?.plan,
          createdAt: u?.createdAt,
          trial_ends_at: u?.trial_ends_at,
        });
      } else {
        setCredits(0);
      }
    } catch (error) {
      setCredits(0);
      if (process.env.NODE_ENV === "development") {
        console.warn("User fetch failed (will retry):", error);
      }
    }
  }, [status, router]);

  // Single run on mount when authenticated (no pathname, avoids refetch on every route change)
  useEffect(() => {
    if (status === "authenticated") fetchUser();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when auth is ready

  const debouncedFetchUser = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchUser();
    }, DEBOUNCE_MS);
  }, [fetchUser]);

  useEffect(() => {
    window.addEventListener("focus", debouncedFetchUser);
    window.addEventListener("dashboard-refresh", debouncedFetchUser);
    window.addEventListener("credits-updated", debouncedFetchUser);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dashboard-refresh") debouncedFetchUser();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", debouncedFetchUser);
      window.removeEventListener("dashboard-refresh", debouncedFetchUser);
      window.removeEventListener("credits-updated", debouncedFetchUser);
      window.removeEventListener("storage", onStorage);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedFetchUser]);

  // Show upgrade popup when user has low credits / trial expiring / low genie (after 2s delay, once per session)
  useEffect(() => {
    if (!dashboardUser || upgradePopupShownRef.current) return;
    const creditsNum = dashboardUser.videoCredits ?? 0;
    const genieNum = dashboardUser.genieEdits ?? 0;
    const trialEnd = dashboardUser.trial_ends_at ? new Date(dashboardUser.trial_ends_at).getTime() : null;
    const created = dashboardUser.createdAt ? new Date(dashboardUser.createdAt).getTime() : null;
    const trialSoon =
      trialEnd != null
        ? trialEnd - Date.now() < 2 * 24 * 60 * 60 * 1000
        : dashboardUser.plan === "trial" &&
          created != null &&
          Date.now() - created > 5 * 24 * 60 * 60 * 1000;
    const needsUpgrade = creditsNum <= 0 || creditsNum <= 2 || trialSoon || genieNum <= 5;
    if (!needsUpgrade) return;
    const t = setTimeout(() => {
      upgradePopupShownRef.current = true;
      setShowUpgradePopup(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [dashboardUser]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 via-purple-50/30 to-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 animate-spin opacity-30" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
              <LogoIcon size={32} className="relative z-10" />
            </div>
          </div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const rawName = session.user?.name;
  const userName =
    typeof rawName === "string" && rawName.trim() && rawName !== "undefined"
      ? rawName.trim()
      : "Creator";
  const rawEmail = session.user?.email;
  const userEmail =
    typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.trim() : "";
  const userInitials =
    userName === "Creator" && userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : userName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-purple-50/30 to-gray-50 overflow-x-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - landing style: light, border-gray-100 */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-50",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform",
          "lg:translate-x-0 lg:transition-none lg:will-change-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "bg-white/80 backdrop-blur-sm border-r border-gray-100 shadow-lg"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - uses your saved file from public/logos/logo.png */}
          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <Logo href="/dashboard" size={40} showText rounded="2xl" className="min-w-0" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 hover:bg-gray-100 lg:hidden transition-colors shrink-0 text-gray-600"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation - purple/pink active, gray hover */}
          <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[48px] items-center gap-3 rounded-full px-4 py-3 font-semibold text-sm transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Credits - light card */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <Coins className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-600">Credits Remaining</p>
                <p className="text-lg font-bold text-gray-900">{credits ?? "…"}</p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-3 block text-center text-sm font-semibold text-purple-600 hover:text-pink-500 transition-colors"
            >
              Subscribe, get more credits
            </Link>
          </div>

          {/* User Profile - gradient avatar like landing */}
          <div className="border-t border-gray-100 p-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 font-semibold text-sm text-white shadow-md">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 shrink-0 transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 py-2 bg-white rounded-2xl border border-gray-100 shadow-xl">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg mx-2 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      clearScriptVideoContext();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg mx-2 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 lg:ml-64">
        {/* Mobile Header - same as landing navbar style, uses your logo */}
        <header className="sticky top-0 z-30 lg:hidden bg-white/70 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-16 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 min-h-12 min-w-12 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0 text-gray-600"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 flex justify-center min-w-0">
              <Logo href="/dashboard" size={36} showText rounded="2xl" className="text-base" />
            </div>
            <div className="w-12 shrink-0" />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full min-w-0">
          <CreditsProvider credits={credits}>
            <DashboardStatsProvider>
              {children}
            </DashboardStatsProvider>
          </CreditsProvider>
        </main>
      </div>

      {showUpgradePopup && dashboardUser && (
        <UpgradePopup
          user={dashboardUser}
          onClose={() => setShowUpgradePopup(false)}
        />
      )}
    </div>
  );
}
