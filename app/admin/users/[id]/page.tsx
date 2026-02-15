"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Mail, Ban, Trash2, Edit2, Save, X, 
  FileText, Video, Activity, CreditCard, Settings,
  UserPlus, LogIn, Eye, Download, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface UserDetail {
  id: string
  full_name: string
  email: string
  created_at: string
  last_active_at: string | null
  credits: number
  plan: string
  role: string
  avatar_url: string | null
}

interface ActivityItem {
  id: string
  action: string
  details: any
  created_at: string
  ip_address: string
  user_agent: string
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'scripts', label: 'Scripts', icon: FileText },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const actionIcons: Record<string, any> = {
  'user.signup': UserPlus,
  'user.login': LogIn,
  'script.generated': FileText,
  'script.viewed': Eye,
  'video.requested': Video,
  'video.completed': Video,
  'video.downloaded': Download,
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = (params?.id as string) ?? ''

  const [user, setUser] = useState<UserDetail | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [trainingVideos, setTrainingVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', credits: 0 })

  useEffect(() => {
    fetchUserData()
  }, [userId])

  async function fetchUserData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (!res.ok) {
        setUser(null)
        return
      }
      setUser(data.user)
      setEditForm({
        full_name: data.user?.full_name || '',
        email: data.user?.email || '',
        credits: data.user?.credits ?? 0,
      })
      setActivities(data.activities || [])
      setScripts(data.scripts || [])
      setVideos(data.videos || [])
      setTrainingVideos(data.trainingVideos || [])
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
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
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'user.signup': 'Signed up',
      'user.login': 'Logged in',
      'script.generated': 'Generated script',
      'script.viewed': 'Viewed script',
      'video.requested': 'Requested video',
      'video.completed': 'Video completed',
      'video.downloaded': 'Downloaded video',
    }
    return labels[action] || action
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('User updated successfully')
      setEditing(false)
      setUser(prev => prev ? { ...prev, ...editForm } : null)
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  async function handleBan() {
    if (!confirm('Are you sure you want to ban this user?')) return
    toast.success('User banned successfully')
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('User deleted successfully')
      router.push('/admin/users')
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-4" />
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-800 rounded-full" />
              <div className="flex-1">
                <div className="h-6 bg-gray-800 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-64" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">User not found</p>
        <Link href="/admin/users" className="text-primary hover:text-primary/80 mt-4 inline-block">
          ← Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/users"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">User Details</h1>
          <p className="text-gray-400 mt-1">Manage user account and activity</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-3xl">
              {user.full_name?.charAt(0) || 'U'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Full Name"
                    className="h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} icon={<X className="h-4 w-4" />}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{user.full_name || 'Unknown'}</h2>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${
                    user.plan === 'pro' ? 'bg-gradient-to-r from-primary to-accent text-white' :
                    user.plan === 'creator' ? 'bg-purple-500/20 text-purple-400' :
                    user.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {user.plan || 'free'}
                  </span>
                  {user.role === 'admin' && (
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mb-4">{user.email}</p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <span className="text-white ml-2">{formatDate(user.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Active:</span>
                    <span className="text-white ml-2">{formatRelativeTime(user.last_active_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Credits:</span>
                    <span className="text-white ml-2">{user.credits ?? 0}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {!editing && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)} icon={<Edit2 className="h-4 w-4" />}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" icon={<Mail className="h-4 w-4" />}>
                Email
              </Button>
              <Button size="sm" variant="ghost" onClick={handleBan} icon={<Ban className="h-4 w-4" />} className="text-red-400 hover:text-red-300">
                Ban
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />} className="text-red-400 hover:text-red-300">
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((activity) => {
                const Icon = actionIcons[activity.action] || Activity
                const details = typeof activity.details === 'string' ? (() => { try { return JSON.parse(activity.details) } catch { return {} } })() : (activity.details || {})
                return (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="p-2 bg-gray-800 rounded-lg text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        {getActionLabel(activity.action)}
                        {details?.topic && (
                          <span className="text-gray-400">: {details.topic}</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(activity.created_at)}
                        {activity.ip_address && (
                          <span className="text-gray-600">• {activity.ip_address}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Activity className="h-10 w-10 mb-2 opacity-50" />
                  <p className="font-medium">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Scripts</h3>
            {scripts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scripts.map((script) => (
                  <div key={script.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
                    <h4 className="text-white font-medium mb-2 truncate">{script.topic}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">{script.platform}</span>
                      <span className="text-gray-500">{formatRelativeTime(script.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileText className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">No scripts generated yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Videos</h3>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v) => (
                  <div key={v.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
                    <div className="aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {v.generatedVideoUrl ? (
                        <video src={v.generatedVideoUrl} className="w-full h-full object-cover" controls />
                      ) : (
                        <Video className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    <h4 className="text-white font-medium mb-2 truncate">{v.topic}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">{v.platform}</span>
                      <span className="text-gray-500">{formatRelativeTime(v.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Video className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">No videos created yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subscription Plan</label>
                  <select className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary" defaultValue={user.plan ?? "trial"}>
                    <option value="trial">Trial (Free 7 days)</option>
                    <option value="creator">Creator ($39/mo)</option>
                    <option value="professional">Professional ($79/mo)</option>
                    <option value="enterprise">Enterprise ($199/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Credits</label>
                  <input
                    type="number"
                    defaultValue={user.credits ?? 0}
                    className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Manually adjust user credits</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Admin Notes</label>
                  <textarea
                    placeholder="Add notes about this user..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button>Save Changes</Button>
              <Button variant="secondary">Reset Password</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
