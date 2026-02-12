"use client"

import { useEffect, useState } from "react"
import { 
  Users, FileText, Video, DollarSign, TrendingUp, TrendingDown,
  UserPlus, LogIn, Eye, Download, Activity
} from "lucide-react"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from "recharts"

interface Stats {
  totalUsers: number
  newUsersThisWeek: number
  totalScripts: number
  scriptsToday: number
  totalVideos: number
  videosToday: number
  activeUsers: number
  recentActivity: any[]
  topUsers: any[]
  chartData: { date: string; signups: number }[]
  growth?: {
    newUsersChange: number
    scriptsTodayChange: number
    videosTodayChange: number
  }
}

const actionIcons: Record<string, any> = {
  'user.signup': UserPlus,
  'user.login': LogIn,
  'script.generated': FileText,
  'script.viewed': Eye,
  'video.requested': Video,
  'video.completed': Video,
  'video.downloaded': Download,
  'avatar.created': Video,
}

const actionColors: Record<string, string> = {
  'user.signup': 'text-blue-400',
  'user.login': 'text-gray-400',
  'script.generated': 'text-purple-400',
  'script.viewed': 'text-cyan-400',
  'video.requested': 'text-pink-400',
  'video.completed': 'text-green-400',
  'video.downloaded': 'text-yellow-400',
  'avatar.created': 'text-indigo-400',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchStats()
    // Auto-refresh every 30 seconds (stats + activity)
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      } else {
        setStats({
          totalUsers: 0,
          newUsersThisWeek: 0,
          totalScripts: 0,
          scriptsToday: 0,
          totalVideos: 0,
          videosToday: 0,
          activeUsers: 0,
          recentActivity: [],
          topUsers: [],
          chartData: [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({
        totalUsers: 0,
        newUsersThisWeek: 0,
        totalScripts: 0,
        scriptsToday: 0,
        totalVideos: 0,
        videosToday: 0,
        activeUsers: 0,
        recentActivity: [],
        topUsers: [],
        chartData: [],
      })
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  function formatRelativeTime(date: string): string {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'user.signup': 'signed up',
      'user.login': 'logged in',
      'script.generated': 'generated a script',
      'script.viewed': 'viewed a script',
      'video.requested': 'requested a video',
      'video.completed': 'completed a video',
      'video.downloaded': 'downloaded a video',
      'avatar.created': 'created their avatar',
    }
    return labels[action] || action
  }

  if (!mounted || loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-800 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Title + Error */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => { setLoading(true); fetchStats(); }}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            {stats.growth?.newUsersChange !== undefined && stats.growth.newUsersChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${stats.growth.newUsersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.growth.newUsersChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{stats.growth.newUsersChange >= 0 ? '+' : ''}{stats.growth.newUsersChange}%</span>
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalUsers)}
          </div>
          <p className="text-gray-400 text-sm">Total Users {stats.newUsersThisWeek > 0 && `(+${stats.newUsersThisWeek} this week)`}</p>
        </div>

        {/* Scripts Generated */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            {(stats.growth?.scriptsTodayChange !== undefined && stats.growth.scriptsTodayChange !== 0) && (
              <span className={`text-sm ${stats.growth.scriptsTodayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.growth.scriptsTodayChange >= 0 ? '+' : ''}{stats.growth.scriptsTodayChange}% today
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalScripts)}
          </div>
          <p className="text-gray-400 text-sm">Scripts Generated {stats.scriptsToday > 0 && `(${stats.scriptsToday} today)`}</p>
        </div>

        {/* Videos Created */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <Video className="h-6 w-6 text-pink-400" />
            </div>
            {(stats.growth?.videosTodayChange !== undefined && stats.growth.videosTodayChange !== 0) && (
              <span className={`text-sm ${stats.growth.videosTodayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.growth.videosTodayChange >= 0 ? '+' : ''}{stats.growth.videosTodayChange}% today
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalVideos)}
          </div>
          <p className="text-gray-400 text-sm">Videos Created {stats.videosToday > 0 && `(${stats.videosToday} today)`}</p>
        </div>

        {/* Active Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-gray-400 text-sm">
              Last 7 days
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.activeUsers)}
          </div>
          <p className="text-gray-400 text-sm">Active Users</p>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">User Signups (Last 30 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fill="url(#colorSignups)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Live Activity</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 10).map((activity, idx) => {
                const Icon = actionIcons[activity.action] || Activity
                const colorClass = actionColors[activity.action] || 'text-gray-400'
                const profile = activity.profiles ?? (activity as any).profile
                return (
                  <div key={activity.id ?? idx} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-800 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        <span className="font-medium">
                          {profile?.full_name || 'User'}
                        </span>{' '}
                        <span className="text-gray-400">
                          {getActionLabel(activity.action)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Activity className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">Waiting for first user...</p>
              </div>
            )}
          </div>
          <a 
            href="/admin/activity" 
            className="block text-center text-sm text-primary hover:text-primary/80 mt-4 pt-4 border-t border-gray-800"
          >
            View All Activity →
          </a>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Most Active Users This Week</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Scripts</th>
                <th className="pb-3 font-medium">Videos</th>
                <th className="pb-3 font-medium">Last Active</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.topUsers.length > 0 ? stats.topUsers.map((user: any) => (
                <tr key={user.id} className="text-sm hover:bg-gray-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-white">{user.scriptCount ?? 0}</td>
                  <td className="py-4 text-white">{user.videoCount ?? 0}</td>
                  <td className="py-4 text-gray-400">
                    {user.last_active_at ? formatRelativeTime(user.last_active_at) : 'Never'}
                  </td>
                  <td className="py-4">
                    <a 
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-10 w-10 mb-2 opacity-50" />
                      <p className="font-medium">No users yet</p>
                      <p className="text-sm">Waiting for first signup...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
