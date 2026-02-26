"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

/**
 * After OAuth (e.g. Google), user lands here. We fetch redirect-destination
 * (onboarding vs dashboard) and send them there. Prevents sending completed
 * users back to onboarding or landing.
 */
export default function AuthRedirectDecidePage() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth/signin"
      return
    }
    if (status !== "authenticated") return

    fetch("/api/auth/redirect-destination", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const target = data?.redirect ?? "/dashboard"
        window.location.href = target
      })
      .catch(() => {
        window.location.href = "/dashboard"
      })
  }, [status])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-500">Taking you to your account…</p>
    </div>
  )
}
