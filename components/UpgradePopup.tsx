"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, AlertTriangle } from "lucide-react"

export interface UpgradePopupUser {
  videoCredits?: number | null
  genieEdits?: number | null
  plan?: string | null
  createdAt?: string | null
  trial_ends_at?: string | null
}

interface UpgradePopupProps {
  user: UpgradePopupUser
  onClose: () => void
}

const TRIAL_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function UpgradePopup({ user, onClose }: UpgradePopupProps) {
  const router = useRouter()
  const [reason, setReason] = useState<string>("")

  useEffect(() => {
    if (!user) return

    const credits = user.videoCredits ?? 0
    const genieEdits = user.genieEdits ?? 0
    const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : null
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : null
    const trialExpiringSoon =
      trialEnd != null
        ? trialEnd - Date.now() < 2 * MS_PER_DAY
        : user.plan === "trial" &&
          createdAt != null &&
          Date.now() - createdAt > (TRIAL_DAYS - 2) * MS_PER_DAY

    if (credits <= 0) {
      setReason("no_credits")
    } else if (credits <= 2) {
      setReason("low_credits")
    } else if (trialExpiringSoon) {
      setReason("trial_expiring")
    } else if (genieEdits <= 5) {
      setReason("low_genie")
    }
  }, [user])

  if (!reason) return null

  const messages: Record<
    string,
    { title: string; subtitle: string; cta: string }
  > = {
    no_credits: {
      title: "You're out of video credits",
      subtitle: "Upgrade to keep creating videos",
      cta: "Upgrade now",
    },
    low_credits: {
      title: `Only ${user.videoCredits ?? 0} credits left`,
      subtitle: "Don't run out. Upgrade for more videos.",
      cta: "Get more credits",
    },
    trial_expiring: {
      title: "Your trial is ending soon",
      subtitle: "Upgrade now to keep all your features.",
      cta: "Upgrade to Pro",
    },
    low_genie: {
      title: "Running low on Genie edits",
      subtitle: "Upgrade for more script refinements.",
      cta: "Get more edits",
    },
  }

  const message = messages[reason]

  const goToPricing = () => {
    onClose()
    router.push("/pricing")
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-popup-title"
    >
      <div className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl border-4 border-primary bg-white p-6 shadow-xl dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2
            id="upgrade-popup-title"
            className="mb-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl"
          >
            {message.title}
          </h2>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            {message.subtitle}
          </p>

          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                Creator
              </h3>
              <div className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                $39
                <span className="text-base font-normal text-gray-500">/mo</span>
              </div>
              <ul className="mb-6 space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 20 video credits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 50 Genie edits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 1 custom avatar
                </li>
              </ul>
              <button
                type="button"
                onClick={goToPricing}
                className="w-full rounded-xl bg-gray-800 py-3 font-semibold text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Choose Creator
              </button>
            </div>

            <div className="relative rounded-xl border-4 border-primary bg-primary/5 p-6 dark:bg-primary/10">
              <span className="absolute -top-3 left-4 rounded bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Best value
              </span>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                Professional
              </h3>
              <div className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                $79
                <span className="text-base font-normal text-gray-500">/mo</span>
              </div>
              <ul className="mb-6 space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 50 video credits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 150 Genie edits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 5 custom avatars
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 1080p HD
                </li>
              </ul>
              <button
                type="button"
                onClick={goToPricing}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary/90"
              >
                Choose Professional
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
