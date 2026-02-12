"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirect /sign-up → /auth/signup so both URLs work.
 */
export default function SignUpRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/auth/signup")
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-400">Redirecting to sign up…</p>
    </div>
  )
}
