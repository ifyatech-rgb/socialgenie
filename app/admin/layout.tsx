"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Users, Activity, BarChart3, Settings, 
  ChevronLeft, Menu, LogOut, Bell, Search
} from "lucide-react"
import { Logo } from "@/components/logo"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/activity", icon: Activity, label: "Activity" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      if (status === "loading") return

      if (!session?.user) {
        setIsAdmin(false)
        router.replace("/auth/signin")
        return
      }

      try {
        const res = await fetch("/api/admin/check")
        const data = await res.json()

        if (!res.ok || !data.isAdmin) {
          setIsAdmin(false)
          toast.error("Access denied. Admin only.")
          router.replace("/dashboard")
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error("Admin check error:", err)
        setIsAdmin(false)
        toast.error("Failed to verify admin access.")
        router.replace("/dashboard")
      }
    }

    checkAdmin()
  }, [session, status, router])

  if (status === "loading" || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <p>Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-50
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-3">
              <Logo size={40} showText={false} href="/admin" />
              {sidebarOpen && (
                <div>
                  <span className="font-bold text-lg">SocialGenie</span>
                  <span className="text-xs text-gray-500 block">Admin Panel</span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = (pathname ?? '') === item.href || 
                (item.href !== "/admin" && (pathname ?? '').startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Collapse Button - Desktop */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center p-4 border-t border-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
            {sidebarOpen && <span className="ml-2 text-sm">Collapse</span>}
          </button>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800">
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users, activity..."
                  className="w-full h-10 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to App
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
