"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { CreditCard, Check, X } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"
import { PLANS, type PlanKey } from "@/lib/plans"

const PAID_PLANS: PlanKey[] = ["creator", "professional", "enterprise"]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const canceled = searchParams?.get("canceled") === "true"
  const planParam = searchParams?.get("plan")?.toLowerCase()
  const selectedPlan: PlanKey = PAID_PLANS.includes(planParam as PlanKey) ? (planParam as PlanKey) : "creator"
  const planConfig = PLANS[selectedPlan]

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (canceled) {
      toast.info("Checkout was canceled. You can subscribe anytime.")
    }
  }, [canceled])

  async function handleSubscribe() {
    setLoading(true)
    try {
      const plan = searchParams?.get("plan")?.toLowerCase()
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email ?? undefined,
          plan: plan === "creator" || plan === "professional" || plan === "enterprise" ? plan : "creator",
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }

      if (res.status === 503) {
        toast.success("Stripe not configured. Add your card in Settings to start your 7-day free trial.")
        router.push("/dashboard")
        return
      }

      if (res.status === 400 && (data.code === "EMAIL_EXISTS" || data.error?.includes("already registered"))) {
        toast.error("This email is already registered. Please sign in instead.")
        router.push("/auth/signin")
        return
      }

      toast.error(data.error || "Checkout failed. Please try again.")
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full filter blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <Link
            href={session ? "/dashboard" : "/"}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 z-10"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="p-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <LogoIcon className="h-8 w-8" />
              <span className="text-xl font-bold text-white">SocialGenie</span>
            </Link>

            <h1 className="text-2xl font-bold text-white mb-2">Start Your 7-Day Free Trial</h1>
            <p className="text-gray-400 mb-6">
              Then ${planConfig.price}/month • Cancel anytime
            </p>

            {canceled && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
                Checkout was canceled. You can try again below or add your card later in Settings.
              </div>
            )}

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                7-day free trial, no charge today
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                3 videos during trial • {planConfig.videoCredits} videos/month after
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Cancel anytime during trial
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-5 w-5" />
              {loading ? "Redirecting to Stripe…" : "Start 7-Day Free Trial"}
            </button>

            <p className="mt-4 text-center text-gray-500 text-sm">
              Secure checkout powered by Stripe
            </p>

            <p className="mt-6 text-center">
              <Link href={session ? "/dashboard" : "/auth/signin"} className="text-primary hover:underline text-sm">
                {session ? "Back to Dashboard" : "Already have an account? Sign in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
