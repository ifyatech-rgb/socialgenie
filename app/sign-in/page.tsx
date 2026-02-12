"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirect /sign-in → /auth/signin so both URLs work.
 */
export default function SignInRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/auth/signin")
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-gray-400">Redirecting to sign in…</p>
    </div>
  )
}
