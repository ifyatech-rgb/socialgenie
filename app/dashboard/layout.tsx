"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import { Logo, LogoIcon } from "@/components/logo";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user credits and payment status; redirect unpaid users to checkout
  useEffect(() => {
    const fetchUser = async () => {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setCredits(data.user?.credits ?? 0);
          const paymentStatus = data.user?.payment_status;
          if (paymentStatus === "pending") {
            router.replace("/checkout-required");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, [status, pathname, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8f9fa] to-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] animate-spin opacity-30" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-[var(--sg-shadow-md)]">
              <LogoIcon size={32} className="animate-pulse" />
            </div>
          </div>
          <p className="text-[var(--sg-text-secondary)] font-semibold">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-white">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Framer style: glass, rounded, gradient accents */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-50",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "sg-glass border-r border-[var(--sg-border)] shadow-[var(--sg-shadow-lg)]"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-[var(--sg-border)] p-6">
            <div className="flex items-center justify-between">
              <Logo size={32} showText={true} href="/dashboard" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-[var(--sg-radius-md)] p-2 hover:bg-[var(--sg-bg-secondary)] lg:hidden transition-colors"
              >
                <X className="h-5 w-5 text-[var(--sg-text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-6">
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
                    "flex min-h-[48px] items-center gap-3 rounded-[var(--sg-radius-full)] px-4 py-3 font-semibold text-sm transition-all duration-200",
                    isActive
                      ? "bg-[length:200%_200%] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_8px_32px_rgba(102,126,234,0.3)]"
                      : "text-[var(--sg-text-secondary)] hover:bg-[rgba(102,126,234,0.08)] hover:text-[#667eea]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Credits Display */}
          <div className="border-t border-[var(--sg-border)] p-6">
            <div className="flex items-center gap-3 rounded-[var(--sg-radius-xl)] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/80 px-4 py-3 shadow-[var(--sg-shadow-sm)]">
              <Coins className="h-5 w-5 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-700">Credits Remaining</p>
                <p className="text-lg font-bold text-amber-900">{credits ?? "…"}</p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-3 block text-center text-sm font-semibold text-[#667eea] hover:text-[#764ba2] transition-colors"
            >
              Subscribe — Get more credits
            </Link>
          </div>

          {/* User Profile */}
          <div className="border-t border-[var(--sg-border)] p-6">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-[var(--sg-radius-lg)] p-3 transition-colors hover:bg-[var(--sg-bg-secondary)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] font-semibold text-sm text-white shadow-[var(--sg-shadow-sm)]">
                  {userInitials}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-[var(--sg-text-primary)] truncate">{userName}</p>
                  <p className="text-xs text-[var(--sg-text-secondary)] truncate">{userEmail}</p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-[var(--sg-text-light)] transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 py-2 sg-glass rounded-[var(--sg-radius-xl)] border border-[var(--sg-border)] shadow-[var(--sg-shadow-xl)]"
                  >
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sg-bg-secondary)] text-[var(--sg-text-primary)] text-sm font-medium rounded-lg mx-2 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <div className="border-t border-[var(--sg-border)] my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg mx-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Mobile Header - glass */}
        <header className="sticky top-0 z-30 lg:hidden sg-glass border-b border-[var(--sg-border)]">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-[var(--sg-radius-md)] hover:bg-[var(--sg-bg-secondary)] transition-colors"
            >
              <Menu className="h-6 w-6 text-[var(--sg-text-secondary)]" />
            </button>
            <Logo size={28} showText={true} />
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
