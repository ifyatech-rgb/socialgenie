"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"

export default function CreatePasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return
    const signupEmail = sessionStorage.getItem("signupEmail")
    if (!signupEmail) {
      router.replace("/")
      return
    }
    setEmail(signupEmail)
  }, [mounted, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }
    const rawAnswers = typeof window !== "undefined" ? sessionStorage.getItem("onboardingAnswers") : null
    const onboardingAnswers = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, string>) : undefined

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, onboardingAnswers }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Signup failed")
        setLoading(false)
        return
      }
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Account created but sign-in failed. Please sign in.")
        router.push("/auth/signin")
        setLoading(false)
        return
      }
      sessionStorage.removeItem("signupEmail")
      sessionStorage.removeItem("onboardingAnswers")
      toast.success("Account created! Taking you to the dashboard.")
      router.push("/dashboard")
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/pricing" })
  }

  if (!mounted || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900">
        <div className="text-white font-medium">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full filter blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <LogoIcon className="h-10 w-auto text-white" />
        </div>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            One last step to start creating viral videos
          </p>

          <div className="rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 mb-5 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Email</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{email}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold py-3 px-4 hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
