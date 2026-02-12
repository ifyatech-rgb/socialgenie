"use client"

import { useEffect, useState } from "react"
import { 
  TrendingUp, TrendingDown, Users, FileText, Video, Activity,
  Calendar, BarChart3
} from "lucide-react"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts"

interface AnalyticsData {
  userGrowth: { date: string; users: number; cumulative: number }[]
  contentCreation: { date: string; scripts: number; videos: number }[]
  platformDistribution: { name: string; value: number }[]
  hourlyActivity: { hour: string; activity: number }[]
  metrics: {
    totalUsers: number
    totalUsersChange: number
    activeUsers: number
    activeUsersChange: number
    totalScripts: number
    totalScriptsChange: number
    totalVideos: number
    totalVideosChange: number
    avgScriptsPerUser: number
    avgScriptsChange: number
    conversionRate: number
    conversionChange: number
  }
}

const COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B']

const dateRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`)
      const json = await res.json()
      if (res.ok && json.metrics != null) {
        setData(json)
      } else {
        setData({
          userGrowth: [],
          contentCreation: [],
          platformDistribution: [],
          hourlyActivity: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, activity: 0 })),
          metrics: {
            totalUsers: 0,
            totalUsersChange: 0,
            activeUsers: 0,
            activeUsersChange: 0,
            totalScripts: 0,
            totalScriptsChange: 0,
            totalVideos: 0,
            totalVideosChange: 0,
            avgScriptsPerUser: 0,
            avgScriptsChange: 0,
            conversionRate: 0,
            conversionChange: 0,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6">
                <div className="h-4 bg-gray-800 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-12 w-12 text-red-400/80 mb-4" />
          <p className="text-white font-medium mb-1">Failed to load analytics</p>
          <p className="text-gray-400 text-sm mb-4">Please try again.</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-white font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Track growth and performance metrics</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex gap-2 flex-wrap">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                dateRange === range.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: data.metrics.totalUsers, change: data.metrics.totalUsersChange, icon: Users, color: 'blue' },
          { label: 'Active Users', value: data.metrics.activeUsers, change: data.metrics.activeUsersChange, icon: Activity, color: 'green' },
          { label: 'Total Scripts', value: data.metrics.totalScripts, change: data.metrics.totalScriptsChange, icon: FileText, color: 'purple' },
          { label: 'Total Videos', value: data.metrics.totalVideos, change: data.metrics.totalVideosChange, icon: Video, color: 'pink' },
          { label: 'Avg Scripts/User', value: data.metrics.avgScriptsPerUser, change: data.metrics.avgScriptsChange, icon: TrendingUp, color: 'cyan' },
          { label: 'Conversion Rate', value: `${data.metrics.conversionRate}%`, change: data.metrics.conversionChange, icon: TrendingUp, color: 'yellow' },
        ].map((metric, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`h-5 w-5 text-${metric.color}-400`} />
              <span className={`text-xs font-medium flex items-center gap-1 ${
                metric.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(metric.change)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white">
              {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
            </div>
            <p className="text-gray-500 text-xs mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={11}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fill="url(#colorUsers)" 
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Creation */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Content Creation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.contentCreation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="scripts" fill="#8B5CF6" name="Scripts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="videos" fill="#EC4899" name="Videos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Platform Distribution</h2>
          <div className="h-48">
            {data.platformDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                <p>No platform data yet</p>
                <p className="text-xs mt-1">Distribution will show when scripts have platform data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.platformDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.platformDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {data.platformDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <span className="text-gray-400">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Activity by Hour (UTC)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  interval={3}
                />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar 
                  dataKey="activity" 
                  fill="#10B981" 
                  name="Activity"
                  radius={[2, 2, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Platform</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">TikTok</p>
              <p className="text-gray-400 text-sm">45% of all content</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Peak Usage Time</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">2PM - 6PM</p>
              <p className="text-gray-400 text-sm">UTC timezone</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Growth Rate</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">+12.5%</p>
              <p className="text-gray-400 text-sm">Week over week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
