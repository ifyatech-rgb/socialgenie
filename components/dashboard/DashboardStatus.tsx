"use client"

import Link from "next/link"
import { getDaysLeftInTrial, getVideosRemaining, getScriptsRemaining } from "@/config/pricing"
import type { PricingUser } from "@/config/pricing"
import { Button } from "@/components/ui/button"

interface DashboardStatusProps {
  user: PricingUser & {
    videosUsed?: number
    scriptsUsed?: number
    hasAvatar?: boolean
  }
}

export function DashboardStatus({ user }: DashboardStatusProps) {
  const trialEnd = user.trialEndDate || user.trialEndsAt
  const isTrialActive = trialEnd && new Date() < new Date(trialEnd)
  const isPaid = user.isPaid ?? (!!trialEnd && !isTrialActive)
  const daysLeft = getDaysLeftInTrial(user)
  const videosUsed = user.videosUsed ?? user.videosUsedThisMonth ?? 0
  const scriptsUsed = user.scriptsUsed ?? user.scriptsUsedThisMonth ?? 0
  const videosRemaining = getVideosRemaining(user)
  const scriptsRemaining = getScriptsRemaining(user)

  if (isTrialActive) {
    return (
      <div className="status-card trial-status rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6 mb-6">
        <div className="status-badge trial inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-4">
          🎁 Free Trial Active
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {daysLeft} days left in trial
        </h2>

        <div className="usage-grid grid sm:grid-cols-1 gap-6 mb-6">
          <div className="usage-item">
            <h3 className="font-semibold text-gray-900 mb-2">Researched Viral Scripts</h3>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (scriptsUsed / 5) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{scriptsUsed}/5 scripts used</p>
          </div>
        </div>

        <div className="upgrade-cta p-4 rounded-xl bg-white border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Upgrade to unlock:</h3>
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li>✓ Unlimited researched viral scripts</li>
            <li>✓ AI topic research &amp; trending hooks</li>
            <li>✓ Platform-optimized (TikTok, IG, YouTube)</li>
          </ul>
          <Link href="/checkout">
            <Button>Upgrade to $19/month</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isPaid) {
    return (
      <div className="status-card paid-status rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 mb-6">
        <div className="status-badge paid inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-4">
          💎 Starter Plan - $19/month
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome back!</h2>

        <div className="stats-grid grid sm:grid-cols-1 gap-6">
          <div className="stat-card p-4 rounded-xl bg-white border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Viral Scripts</h3>
            <div className="text-2xl font-bold text-primary">Unlimited</div>
            <p className="text-xs text-gray-500 mt-1">Generate as many researched scripts as you need</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
