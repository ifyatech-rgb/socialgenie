"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { signIn, getCsrfToken } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, X, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"
import { PLANS, type PlanKey } from "@/lib/plans"

const PAID_PLANS: PlanKey[] = ["creator", "professional", "enterprise"]

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledEmail = searchParams?.get("email")?.trim() ?? ""
  const planParam = searchParams?.get("plan")?.toLowerCase()
  const selectedPlan: PlanKey = PAID_PLANS.includes(planParam as PlanKey) ? (planParam as PlanKey) : "creator"
  const planConfig = PLANS[selectedPlan]
  const [isLogin, setIsLogin] = useState(true)
  const [noAccountFound, setNoAccountFound] = useState(false)

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptEmails, setAcceptEmails] = useState(true)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Pre-fill email when coming from sign-up redirect (?email=...)
  useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }))
    }
  }, [prefilledEmail])

  // Show error when NextAuth redirects back (e.g. after form submit to callback failed)
  useEffect(() => {
    const err = searchParams?.get("error")?.trim()
    if (err) {
      if (err === "CredentialsSignin" || err === "OAuthAccountNotLinked") {
        toast.error("Invalid credentials or session error. Please try again.")
      } else if (err === "OAuthCallback" || err === "OAuthCreateAccount") {
        toast.error("Sign-in failed. Please try again.")
      } else {
        toast.error("Something went wrong. Please try again.")
      }
      // Clear the error from URL without full reload
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      url.searchParams.delete("error_description")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (e.target.name === "email") setNoAccountFound(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    try {
      if (isLogin) {
        // Step 1: Verify credentials with our API (so we can show clear errors)
        const verifyRes = await fetch("/api/auth/verify-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const verifyData = await verifyRes.json().catch(() => ({}))
        if (!verifyRes.ok || !verifyData.ok) {
          const err = verifyData.error || "Login failed. Please try again."
          if (err.includes("No account found")) {
            setNoAccountFound(true)
          }
          toast.error(err)
          setLoading(false)
          return
        }
        // Step 2: Create session via NextAuth — use form submit so cookie is set and browser redirects
        const csrfToken = await getCsrfToken()
        const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard"
        const form = document.createElement("form")
        form.method = "POST"
        form.action = "/api/auth/callback/credentials"
        form.style.display = "none"
        const fields: Record<string, string> = {
          csrfToken: csrfToken ?? "",
          email,
          password,
          callbackUrl,
        }
        for (const [name, value] of Object.entries(fields)) {
          const input = document.createElement("input")
          input.name = name
          input.value = value
          input.type = "hidden"
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const result = await signIn("credentials", {
        email,
        password,
        name: fullName,
        redirect: false,
        callbackUrl: "/dashboard",
      })

      if (result?.error) {
        const message = typeof result.error === "string" ? result.error : "Failed to create account. Please try again."
        if (message.includes("already registered")) {
          setIsLogin(true)
        } else {
          toast.error(message)
        }
        setLoading(false)
        return
      }

      if (result?.ok && result?.url) {
        toast.success("Account created! Redirecting to secure checkout…")
        window.location.assign(result.url)
        return
      }

      {
        // New signup: send to Stripe checkout for card (7-day trial + 10 credits), same as /auth/signup
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
          setIsLogin(true)
          setLoading(false)
          return
        }
        if (res.status === 503) {
          toast.success("You get 10 free credits! Add your card in Settings later.")
        }
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-8 overflow-x-hidden">
      {/* Background with blur effect */}
      <div className="fixed inset-0 z-0">
        {/* Gradient background with animated blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900" />
        
        {/* Decorative blurred elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full filter blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full filter blur-[120px]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-0">
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Close button - 48px tap target */}
          <Link 
            href="/"
            className="absolute top-4 right-4 p-3 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 rounded-xl hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <LogoIcon size={48} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Welcome to Voxara!
              </h1>
              <p className="text-gray-400 text-sm">
                Your partner to go viral
              </p>
              {!isLogin && (
                <p className="mt-2 text-xs text-gray-500 max-w-xs mx-auto">
                  After you create your account, you’ll be taken to a secure Stripe page to add your card for the 7-day free trial (10 free credits). No charge during the trial.
                </p>
              )}
            </div>

            {noAccountFound && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex flex-col gap-2">
                <span>No account found. Please sign up first.</span>
                <Link href="/auth/signup" className="font-medium text-white hover:underline inline-flex items-center gap-1">
                  Don&apos;t have an account? Sign up
                </Link>
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full min-h-[48px] sm:min-h-[52px] flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl text-white font-medium transition-colors duration-200 mb-6"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLogin ? "Log in with Google" : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500">
                  {isLogin ? "or log in with email" : "or sign up with email"}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name fields - only for signup */}
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      <span className="text-accent">*</span> First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full min-h-[48px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      <span className="text-accent">*</span> Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full min-h-[48px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <span className="text-accent">*</span> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full min-h-[48px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <span className="text-accent">*</span> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Password"
                    className="w-full min-h-[48px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <span className="text-accent">*</span> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Enter Password"
                      className="w-full min-h-[48px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200 pr-12"
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 rounded-lg"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Email updates checkbox - only for signup */}
              {!isLogin && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={acceptEmails}
                      onChange={(e) => setAcceptEmails(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                      acceptEmails 
                        ? "bg-primary border-primary" 
                        : "bg-gray-800 border-gray-600"
                    }`}>
                      {acceptEmails && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-300">
                    I'd like to receive emails with updates and offers.
                  </span>
                </label>
              )}

              {/* Forgot password - only for login */}
              {isLogin && (
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit Button: Log In or Start 7-Day Free Trial (no "Create Account") */}
              <button
                type="submit"
                disabled={loading}
                className={
                  isLogin
                    ? "w-full min-h-[52px] py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 min-w-0 active:scale-[0.98]"
                    : "signup-trial-button w-full min-h-[52px] sm:min-h-[56px] py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30 min-w-0 active:scale-[0.98]"
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing…
                  </span>
                ) : isLogin ? (
                  "Log In"
                ) : (
                  <>
                    <div className="button-content flex items-center justify-center gap-2">
                      <CreditCard size={20} className="shrink-0" />
                      <span>Start 7-Day Free Trial</span>
                    </div>
                    <small className="subtext text-white/90 text-sm font-normal">
                      Then ${planConfig.price}/month • Cancel anytime
                    </small>
                  </>
                )}
              </button>
            </form>

            {/* Toggle login/signup */}
            <p className="text-center text-gray-400 text-sm mt-6">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-white hover:text-primary font-medium transition-colors">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-white hover:text-primary font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            {/* Terms */}
            <p className="text-center text-gray-500 text-xs mt-4">
              By clicking the access code, you agree to the{" "}
              <Link href="/terms" className="text-gray-400 hover:text-white underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-gray-400 hover:text-white underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
