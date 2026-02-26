"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirect /sign-up → /onboarding (streamlined flow: onboarding → create password → pricing).
 */
export default function SignUpRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/onboarding")
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-400">Redirecting to sign up…</p>
    </div>
  )
}
