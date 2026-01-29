"use client"

import { useState } from "react"
import { 
  Save, Shield, Bell, Mail, Database, Key, Globe, 
  CreditCard, Zap, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  
  const [settings, setSettings] = useState({
    // General
    siteName: 'Voxara',
    siteUrl: 'https://viralclone.com',
    supportEmail: 'support@viralclone.com',
    
    // Notifications
    emailNewSignups: true,
    emailDailyReport: true,
    emailErrors: true,
    slackIntegration: false,
    slackWebhook: '',
    
    // API Keys
    openaiKey: 'sk-...hidden',
    anthropicKey: 'sk-ant-...hidden',
    didApiKey: '...hidden',
    heygenApiKey: '',
    
    // Limits
    freeCredits: 10,
    starterCredits: 50,
    creatorCredits: 200,
    proCredits: -1, // unlimited
    
    // Features
    signupsEnabled: true,
    maintenanceMode: false,
    betaFeatures: false,
  })

  async function handleSave() {
    setLoading(true)
    try {
      // API call to save settings
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Configure your platform settings</p>
        </div>
        <Button onClick={handleSave} loading={loading} icon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
            <p className="text-gray-500 text-sm">Basic platform configuration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings(s => ({ ...s, siteName: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Site URL</label>
            <input
              type="url"
              value={settings.siteUrl}
              onChange={(e) => setSettings(s => ({ ...s, siteUrl: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Bell className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <p className="text-gray-500 text-sm">Configure admin notifications</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'emailNewSignups', label: 'Email on new signups', description: 'Receive email when a new user registers' },
            { key: 'emailDailyReport', label: 'Daily report', description: 'Receive daily summary of activity' },
            { key: 'emailErrors', label: 'Error alerts', description: 'Receive email when critical errors occur' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? 'bg-primary' : 'bg-gray-700'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Key className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">API Keys</h2>
            <p className="text-gray-500 text-sm">Manage external service API keys</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={settings.openaiKey}
              onChange={(e) => setSettings(s => ({ ...s, openaiKey: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary font-mono"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Anthropic API Key</label>
            <input
              type="password"
              value={settings.anthropicKey}
              onChange={(e) => setSettings(s => ({ ...s, anthropicKey: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary font-mono"
              placeholder="sk-ant-..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">D-ID API Key</label>
            <input
              type="password"
              value={settings.didApiKey}
              onChange={(e) => setSettings(s => ({ ...s, didApiKey: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">HeyGen API Key</label>
            <input
              type="password"
              value={settings.heygenApiKey}
              onChange={(e) => setSettings(s => ({ ...s, heygenApiKey: e.target.value }))}
              className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary font-mono"
              placeholder="Not configured"
            />
          </div>
        </div>
      </div>

      {/* Credit Limits */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Credit Limits</h2>
            <p className="text-gray-500 text-sm">Set monthly credit limits per plan</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'freeCredits', label: 'Free', value: settings.freeCredits },
            { key: 'starterCredits', label: 'Starter', value: settings.starterCredits },
            { key: 'creatorCredits', label: 'Creator', value: settings.creatorCredits },
            { key: 'proCredits', label: 'Pro', value: settings.proCredits },
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-sm text-gray-400 mb-2">{item.label}</label>
              <input
                type="number"
                value={item.value}
                onChange={(e) => setSettings(s => ({ ...s, [item.key]: parseInt(e.target.value) }))}
                className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary"
                placeholder={item.value === -1 ? 'Unlimited' : ''}
              />
              {item.value === -1 && <p className="text-xs text-gray-500 mt-1">-1 = Unlimited</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Feature Flags</h2>
            <p className="text-gray-500 text-sm">Toggle platform features</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
            <div>
              <p className="text-white font-medium">User Signups</p>
              <p className="text-gray-500 text-sm">Allow new users to register</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.signupsEnabled}
                onChange={(e) => setSettings(s => ({ ...s, signupsEnabled: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${
                settings.signupsEnabled ? 'bg-green-500' : 'bg-gray-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.signupsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-gray-500 text-sm">Show maintenance page to all users</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings(s => ({ ...s, maintenanceMode: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
            <div>
              <p className="text-white font-medium">Beta Features</p>
              <p className="text-gray-500 text-sm">Enable experimental features for all users</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.betaFeatures}
                onChange={(e) => setSettings(s => ({ ...s, betaFeatures: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${
                settings.betaFeatures ? 'bg-primary' : 'bg-gray-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.betaFeatures ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
            <p className="text-gray-500 text-sm">Irreversible actions</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Reset All User Data</p>
              <p className="text-gray-500 text-sm">Delete all user content and reset credits</p>
            </div>
            <Button variant="danger" size="sm">
              Reset Data
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Clear Activity Logs</p>
              <p className="text-gray-500 text-sm">Delete all activity log entries</p>
            </div>
            <Button variant="danger" size="sm">
              Clear Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
