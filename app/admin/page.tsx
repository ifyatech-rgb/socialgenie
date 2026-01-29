"use client"

import { useEffect, useState } from "react"
import { 
  Users, FileText, Video, DollarSign, TrendingUp, TrendingDown,
  UserPlus, LogIn, Eye, Download, Activity
} from "lucide-react"
import { Card } from "@/components/ui/card"
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
}

const actionIcons: Record<string, any> = {
  'user.signup': UserPlus,
  'user.login': LogIn,
  'script.generated': FileText,
  'script.viewed': Eye,
  'video.requested': Video,
  'video.completed': Video,
  'video.downloaded': Download,
}

const actionColors: Record<string, string> = {
  'user.signup': 'text-blue-400',
  'user.login': 'text-gray-400',
  'script.generated': 'text-purple-400',
  'script.viewed': 'text-cyan-400',
  'video.requested': 'text-pink-400',
  'video.completed': 'text-green-400',
  'video.downloaded': 'text-yellow-400',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
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
    }
    return labels[action] || action
  }

  if (loading) {
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

  if (!stats) return null

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>+{stats.newUsersThisWeek}</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalUsers)}
          </div>
          <p className="text-gray-400 text-sm">Total Users</p>
        </div>

        {/* Scripts Generated */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>{stats.scriptsToday} today</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalScripts)}
          </div>
          <p className="text-gray-400 text-sm">Scripts Generated</p>
        </div>

        {/* Videos Created */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <Video className="h-6 w-6 text-pink-400" />
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>{stats.videosToday} today</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalVideos)}
          </div>
          <p className="text-gray-400 text-sm">Videos Created</p>
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
                
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-800 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        <span className="font-medium">
                          {activity.profiles?.full_name || 'User'}
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
              // Demo data
              [
                { name: 'Sarah Chen', action: 'generated a script', time: '2m ago' },
                { name: 'Mike Rodriguez', action: 'signed up', time: '5m ago' },
                { name: 'Lisa Park', action: 'created a video', time: '8m ago' },
                { name: 'James Wilson', action: 'logged in', time: '12m ago' },
                { name: 'Emma Stone', action: 'downloaded video', time: '15m ago' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800 text-purple-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="font-medium">{item.name}</span>{' '}
                      <span className="text-gray-400">{item.action}</span>
                    </p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))
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
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Last Active</th>
                <th className="pb-3 font-medium">Credits</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(stats.topUsers.length > 0 ? stats.topUsers : [
                { id: '1', full_name: 'Sarah Chen', email: 'sarah@example.com', created_at: '2024-01-15', last_active_at: new Date().toISOString(), credits: 45 },
                { id: '2', full_name: 'Mike Rodriguez', email: 'mike@example.com', created_at: '2024-01-10', last_active_at: new Date(Date.now() - 3600000).toISOString(), credits: 32 },
                { id: '3', full_name: 'Lisa Park', email: 'lisa@example.com', created_at: '2024-01-05', last_active_at: new Date(Date.now() - 7200000).toISOString(), credits: 78 },
              ]).map((user: any) => (
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
                  <td className="py-4 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-gray-400">
                    {user.last_active_at ? formatRelativeTime(user.last_active_at) : 'Never'}
                  </td>
                  <td className="py-4">
                    <span className="text-white">{user.credits || 0}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
