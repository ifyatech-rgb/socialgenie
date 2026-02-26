"use client"

import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export interface UpgradeModalProps {
  onClose: () => void
  reason: "credits" | "trial"
  creditsRemaining: number
}

const messages = {
  credits: {
    title: "Out of Credits!",
    description:
      "You've used all your free credits. Upgrade to continue creating amazing videos!",
    emoji: "🎬",
  },
  trial: {
    title: "Free Trial Expired!",
    description:
      "Your 14-day free trial has ended. Upgrade to keep creating viral content!",
    emoji: "⭐",
  },
}

export function UpgradeModal({
  onClose,
  reason,
  creditsRemaining,
}: UpgradeModalProps) {
  const router = useRouter()
  const message = messages[reason]

  const goToPricing = (plan?: string) => {
    onClose()
    router.push(plan ? `/pricing?plan=${plan}` : "/pricing")
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8 text-5xl">{message.emoji}</div>
        <h2
          id="upgrade-modal-title"
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3"
        >
          {message.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-lg mb-8">
          {message.description}
        </p>

        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 mb-8">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              Credits Remaining
            </span>
            <span
              className={
                creditsRemaining > 0
                  ? "text-2xl font-bold text-primary"
                  : "text-2xl font-bold text-red-500"
              }
            >
              {creditsRemaining}
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 mb-6">
          <div className="relative rounded-2xl border-2 border-primary bg-primary/5 dark:bg-primary/10 p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-2">
              Professional
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                $79
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <li>✓ 50 Video Credits</li>
              <li>✓ 5 Custom Avatars</li>
              <li>✓ 1080p HD Export</li>
              <li>✓ Priority Support</li>
            </ul>
            <button
              type="button"
              onClick={() => goToPricing("professional")}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white hover:opacity-90 transition"
            >
              Upgrade Now →
            </button>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Creator
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                $39
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <li>✓ 20 Video Credits</li>
              <li>✓ 1 Custom Avatar</li>
              <li>✓ 720p Export</li>
              <li>✓ All Features</li>
            </ul>
            <button
              type="button"
              onClick={() => goToPricing("creator")}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 py-3 font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Choose Creator →
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goToPricing()}
          className="block w-full text-center text-primary font-semibold py-3 hover:underline"
        >
          View All Plans & Features →
        </button>
      </div>
    </div>
  )
}
