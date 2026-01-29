"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight,
  UserPlus, LogIn, FileText, Video, Eye, Activity, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActivityItem {
  id: string
  user_id: string
  action: string
  details: any
  ip_address: string
  user_agent: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

const actionIcons: Record<string, any> = {
  'user.signup': UserPlus,
  'user.login': LogIn,
  'user.logout': LogIn,
  'script.generated': FileText,
  'script.viewed': Eye,
  'script.deleted': FileText,
  'video.requested': Video,
  'video.completed': Video,
  'video.downloaded': Video,
}

const actionColors: Record<string, string> = {
  'user.signup': 'bg-blue-500/20 text-blue-400',
  'user.login': 'bg-gray-700 text-gray-400',
  'user.logout': 'bg-gray-700 text-gray-400',
  'script.generated': 'bg-purple-500/20 text-purple-400',
  'script.viewed': 'bg-cyan-500/20 text-cyan-400',
  'script.deleted': 'bg-red-500/20 text-red-400',
  'video.requested': 'bg-pink-500/20 text-pink-400',
  'video.completed': 'bg-green-500/20 text-green-400',
  'video.downloaded': 'bg-yellow-500/20 text-yellow-400',
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...(actionFilter !== 'all' && { action: actionFilter }),
      })
      
      const res = await fetch(`/api/admin/activity?${params}`)
      const data = await res.json()
      
      setActivities(data.activities || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    fetchActivity()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [fetchActivity])

  function handleRefresh() {
    setRefreshing(true)
    fetchActivity()
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
      'user.signup': 'Signed up',
      'user.login': 'Logged in',
      'user.logout': 'Logged out',
      'script.generated': 'Generated script',
      'script.viewed': 'Viewed script',
      'script.deleted': 'Deleted script',
      'video.requested': 'Requested video',
      'video.completed': 'Video completed',
      'video.downloaded': 'Downloaded video',
    }
    return labels[action] || action
  }

  function parseUserAgent(ua: string | null): string {
    if (!ua) return 'Unknown'
    if (ua.includes('Chrome') && ua.includes('Mac')) return 'Chrome / Mac'
    if (ua.includes('Chrome') && ua.includes('Windows')) return 'Chrome / Windows'
    if (ua.includes('Safari') && ua.includes('Mac')) return 'Safari / Mac'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Mobile')) return 'Mobile'
    return 'Desktop'
  }

  async function exportCSV() {
    const headers = ['User', 'Email', 'Action', 'Details', 'IP Address', 'Device', 'Timestamp']
    const rows = activities.map(a => [
      a.profiles?.full_name || 'Unknown',
      a.profiles?.email || '',
      a.action,
      JSON.stringify(a.details || {}),
      a.ip_address || '',
      parseUserAgent(a.user_agent),
      new Date(a.created_at).toISOString()
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Track all user activity in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            loading={refreshing}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            onClick={exportCSV}
            icon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Live • Auto-refreshing every 30 seconds
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="w-full h-11 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="h-11 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Actions</option>
          <option value="user.signup">Signups</option>
          <option value="user.login">Logins</option>
          <option value="script.generated">Scripts Generated</option>
          <option value="video.requested">Videos Requested</option>
          <option value="video.completed">Videos Completed</option>
        </select>
      </div>

      {/* Activity Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800 bg-gray-900/50">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Details</th>
                <th className="p-4 font-medium">IP Address</th>
                <th className="p-4 font-medium">Device</th>
                <th className="p-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
                          <div className="h-3 bg-gray-800 rounded w-48" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No activity found
                  </td>
                </tr>
              ) : (
                activities.map((activity) => {
                  const Icon = actionIcons[activity.action] || Activity
                  const colorClass = actionColors[activity.action] || 'bg-gray-700 text-gray-400'
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {activity.profiles?.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {activity.profiles?.full_name || 'Unknown'}
                            </p>
                            <p className="text-gray-500 text-xs truncate">
                              {activity.profiles?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${colorClass}`}>
                          <Icon className="h-3 w-3" />
                          {getActionLabel(activity.action)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                        {activity.details?.topic || activity.details?.platform || '-'}
                      </td>
                      <td className="p-4 text-gray-400 text-sm font-mono">
                        {activity.ip_address || '-'}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {parseUserAgent(activity.user_agent)}
                      </td>
                      <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(activity.created_at)}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Showing {((page - 1) * 100) + 1}-{Math.min(page * 100, total)} of {total} activities
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
