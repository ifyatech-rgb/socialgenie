"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Search, Filter, Download, MoreVertical, ChevronLeft, ChevronRight,
  Eye, Mail, Ban, Trash2, UserCheck, Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  full_name: string
  email: string
  created_at: string
  last_active_at: string | null
  credits: number
  plan: string
  role: string
  scriptCount: number
  videoCount: number
  isActive: boolean
}

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || 'all')
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [actionMenu, setActionMenu] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(planFilter !== 'all' && { plan: planFilter }),
      })
      
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, planFilter])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [fetchUsers])

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatRelativeTime(date: string | null): string {
    if (!date) return 'Never'
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(date)
  }

  function getPlanBadgeClass(plan: string): string {
    const classes: Record<string, string> = {
      'free': 'bg-gray-700 text-gray-300',
      'starter': 'bg-blue-500/20 text-blue-400',
      'creator': 'bg-purple-500/20 text-purple-400',
      'pro': 'bg-gradient-to-r from-primary to-accent text-white',
    }
    return classes[plan] || 'bg-gray-700 text-gray-300'
  }

  function toggleSelectAll() {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  function toggleSelectUser(userId: string) {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  async function exportCSV() {
    // Create CSV content
    const headers = ['Name', 'Email', 'Signup Date', 'Last Active', 'Plan', 'Scripts', 'Videos', 'Credits']
    const rows = users.map(u => [
      u.full_name,
      u.email,
      formatDate(u.created_at),
      u.last_active_at ? formatDate(u.last_active_at) : 'Never',
      u.plan,
      u.scriptCount,
      u.videoCount,
      u.credits
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage all registered users</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={exportCSV}
          icon={<Download className="h-4 w-4" />}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email..."
            className="w-full h-11 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-11 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="admin">Admins</option>
        </select>

        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          className="h-11 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="creator">Creator</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800 bg-gray-900/50">
                <th className="p-4 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-600"
                  />
                </th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Signup Date</th>
                <th className="p-4 font-medium">Last Active</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Scripts</th>
                <th className="p-4 font-medium">Videos</th>
                <th className="p-4 font-medium">Credits</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="p-4">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="w-4 h-4 bg-gray-800 rounded" />
                        <div className="w-10 h-10 bg-gray-800 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
                          <div className="h-3 bg-gray-800 rounded w-48" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {user.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate flex items-center gap-2">
                            {user.full_name || 'Unknown'}
                            {user.role === 'admin' && (
                              <Crown className="h-3 w-3 text-yellow-400" />
                            )}
                          </p>
                          <p className="text-gray-500 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {formatRelativeTime(user.last_active_at)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getPlanBadgeClass(user.plan)}`}>
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="p-4 text-white text-sm">{user.scriptCount}</td>
                    <td className="p-4 text-white text-sm">{user.videoCount}</td>
                    <td className="p-4 text-white text-sm">{user.credits}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {actionMenu === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActionMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1">
                              <button
                                onClick={() => { router.push(`/admin/users/${user.id}`); setActionMenu(null) }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => { setActionMenu(null) }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                Send Email
                              </button>
                              <button
                                onClick={() => { setActionMenu(null) }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <UserCheck className="h-4 w-4" />
                                Impersonate
                              </button>
                              <hr className="my-1 border-gray-700" />
                              <button
                                onClick={() => { setActionMenu(null) }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Ban className="h-4 w-4" />
                                Ban User
                              </button>
                              <button
                                onClick={() => { setActionMenu(null) }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, total)} of {total} users
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
