"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, X, Check, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"

const REDIRECT_MESSAGE = "You already have an account! Redirecting to sign in..."
const REDIRECT_DELAY_MS = 2000

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams?.get("canceled") === "1"

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const checkEmail = useCallback(async (email: string) => {
    const e = email?.trim().toLowerCase()
    if (!e) return
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(e)}`)
      const data = await res.json().catch(() => ({}))
      setEmailExists(data.exists === true)
    } catch {
      setEmailExists(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...formData, [e.target.name]: e.target.value }
    setFormData(next)
    if (e.target.name === "email") setEmailExists(false)
  }

  const handleEmailBlur = () => {
    if (formData.email?.trim()) checkEmail(formData.email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)

    try {
      // FIX1: Check if email exists in database BEFORE signIn or Stripe redirect
      const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email.trim())}`)
      const checkData = await checkRes.json().catch(() => ({}))
      if (checkData.exists === true) {
        setEmailExists(true)
        setRedirecting(true)
        toast.info(REDIRECT_MESSAGE)
        setLoading(false)
        const emailParam = encodeURIComponent(formData.email.trim())
        setTimeout(() => {
          router.push(`/auth/signin?email=${emailParam}&message=account_exists`)
        }, REDIRECT_DELAY_MS)
        return
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        name: fullName,
        redirect: false,
      })

      if (result?.error) {
        const message = typeof result.error === "string" ? result.error : "Failed to create account. Please try again."
        if (message.includes("already registered") || message.includes("already exists")) {
          setEmailExists(true)
          setRedirecting(true)
          toast.info(REDIRECT_MESSAGE)
          setLoading(false)
          const emailParam = encodeURIComponent(formData.email.trim())
          setTimeout(() => router.push(`/auth/signin?email=${emailParam}&message=account_exists`), REDIRECT_DELAY_MS)
          return
        }
        toast.error(message)
        setLoading(false)
        return
      }

      toast.success("Account created! Redirecting to secure checkout…")
      router.refresh()

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }

      if (res.status === 400 && (data.code === "EMAIL_EXISTS" || data.error?.includes("already registered"))) {
        setEmailExists(true)
        setRedirecting(true)
        toast.info(REDIRECT_MESSAGE)
        setLoading(false)
        const emailParam = encodeURIComponent(formData.email.trim())
        setTimeout(() => router.push(`/auth/signin?email=${emailParam}&message=account_exists`), REDIRECT_DELAY_MS)
        return
      }

      if (res.status === 503) {
        toast.success("You get 10 free credits! Add your card in Settings for continued access after trial.")
      }
      router.push("/dashboard")
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full filter blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <Link
            href="/"
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 z-10"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <LogoIcon size={48} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Start your 7-day free trial
              </h1>
              <p className="text-gray-400 text-sm">
                10 free credits • No charge for 7 days
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-success" /> 7-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-success" /> 10 free credits
                </span>
              </div>
              {/* Step indicator: card details are on the next page (Stripe) */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">Step 1</span>
                <span className="text-gray-600">Account</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium">Step 2</span>
                <span className="text-gray-600">Card on secure page (Stripe)</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                After you click below, you’ll be taken to a secure Stripe page to add your card. We don’t charge you during the 7-day trial.
              </p>
            </div>

            {canceled && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                Checkout was canceled. You can add your card later in Settings and still use your 10 free credits.
              </div>
            )}

            {emailExists && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex flex-col gap-2">
                <span>{REDIRECT_MESSAGE}</span>
                {redirecting ? (
                  <span className="text-gray-400 text-xs">Redirecting in 2 seconds…</span>
                ) : (
                  <Link href={`/auth/signin?email=${encodeURIComponent(formData.email.trim())}`} className="font-medium text-white hover:underline inline-flex items-center gap-1">
                    Go to Sign in now →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">First name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Last name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  placeholder="name@example.com"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 ${
                    emailExists ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-700 focus:border-primary focus:ring-primary"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="signup-trial-button w-full py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30"
              >
                <div className="button-content flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <CreditCard size={20} className="shrink-0" />
                  )}
                  <span>{loading ? "Processing…" : "Start 7-Day Free Trial"}</span>
                </div>
                <small className="subtext text-white/90 text-sm font-normal">
                  Then $19/month • Cancel anytime
                </small>
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-white hover:text-primary font-medium">
                Sign in
              </Link>
            </p>

            <p className="text-center text-gray-500 text-xs mt-4">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-gray-400 underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-gray-400 underline">Privacy Policy</Link>.
              Your card is not charged during the 7-day trial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
