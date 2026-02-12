"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Video, Wand2, LayoutGrid, User, FileText, Palette, BookOpen, Bell, ChevronLeft, Play } from "lucide-react";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/projects", label: "Projects", icon: Video },
  { href: "/dashboard/ai-studio", label: "Video Agent", icon: Wand2, badge: "New!" },
  { href: "/dashboard/generate-script", label: "Apps", icon: LayoutGrid },
];

const assetItems = [
  { href: "/dashboard/avatars", label: "Avatars", icon: User, showPlus: true },
  { href: "/dashboard/generate-script", label: "Templates", icon: FileText },
  { href: "/dashboard/settings", label: "Brand System", icon: Palette },
  { href: "#", label: "Knowledge", icon: BookOpen },
];

export function ProjectsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col border-r" style={{ backgroundColor: "#0f0f0f", borderColor: "#2a2a2a" }}>
      <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: "#2a2a2a" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon size={28} className="text-white" />
          <span className="text-lg font-bold text-white">SocialGenie</span>
        </Link>
        <button type="button" className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Collapse">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <Link
          href="/dashboard/ai-studio"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#00d9ff" }}
        >
          <Play className="h-4 w-4 fill-current" />
          Create
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard/projects" ? pathname?.startsWith("/dashboard/projects") : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
              style={isActive ? { backgroundColor: "#1a4d4d", borderLeft: "2px solid #00d9ff" } : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-4 py-3" style={{ borderColor: "#2a2a2a" }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#888888" }}>
          Assets
        </p>
        <div className="space-y-1">
          {assetItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.showPlus && <span className="text-sm">+</span>}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 border-t p-4" style={{ borderColor: "#2a2a2a" }}>
        <button type="button" className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#00d9ff" }}>
            1
          </span>
        </button>
        <Link href="/checkout" className="flex w-full items-center justify-center rounded-lg px-4 py-3 font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#00d9ff" }}>
          Upgrade
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10">🚀</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">Voxflow</p>
            <p className="text-xs" style={{ color: "#888888" }}>1 Free</p>
          </div>
          <span className="text-gray-500">›</span>
        </div>
      </div>
    </aside>
  );
}
