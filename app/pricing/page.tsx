"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Check, ChevronDown, Sparkles } from "lucide-react"
import { toast } from "sonner"
import LandingNavbar from "@/components/LandingNavbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { PLANS, type PlanKey } from "@/lib/plans"

const PAID_PLAN_KEYS: PlanKey[] = ["creator", "professional"]

export default function PricingPage() {
  const router = useRouter()
  const { status } = useSession()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const isLoggedIn = status === "authenticated"

  const startCheckout = async (plan: PlanKey) => {
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 503) toast.info(data.error || "Stripe not configured. Add your card in Settings later.")
        else toast.error(data.error || "Checkout failed.")
        return
      }
      if (data.url) window.location.href = data.url
      else toast.error("No checkout URL returned.")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-light">
      <LandingNavbar />

      <div className="pricing-page pt-16 lg:pt-24">
        {/* Header */}
        <Section background="white" padding="lg">
          <div className="pricing-header text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-dark mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="subtitle text-xl text-gray-600 mb-3 leading-relaxed">
              Start free • Creator $39 • Professional $79
            </p>
            <p className="no-commitment text-gray-500 text-sm">
              Cancel anytime • No hidden fees • No contracts
            </p>
          </div>
        </Section>

        {/* Free Trial Hero */}
        <Section background="light" padding="lg">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border-4 border-primary bg-gradient-to-br from-primary/10 to-accent/10 p-6 sm:p-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-2 mb-4">
                <Sparkles className="h-4 w-4" />
                Start free
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-dark mb-2">
                7-Day Free Trial
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                5 FREE credits • Create 2–5 videos • All features unlocked
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-sm text-gray-700 mb-6 max-w-xl mx-auto">
                {PLANS.trial.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Button
                  size="xl"
                  className="min-h-[52px] px-8 rounded-2xl bg-gradient-to-br from-primary to-accent"
                  onClick={async () => {
                    setLoading("trial")
                    try {
                      const userRes = await fetch("/api/user")
                      const userData = await userRes.json().catch(() => ({}))
                      if (userData?.user && !userData.user.onboardingCompleted) {
                        setLoading(null)
                        router.push("/onboarding")
                        return
                      }
                      const res = await fetch("/api/user/activate-trial", { method: "POST" })
                      if (!res.ok) throw new Error("Failed to activate trial")
                      toast.success("Trial activated. Taking you to the dashboard.")
                      router.push("/dashboard")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed to activate trial")
                    } finally {
                      setLoading(null)
                    }
                  }}
                  disabled={!!loading}
                >
                  {loading === "trial" ? "Activating…" : "Start Free Trial →"}
                </Button>
              ) : (
                <Link href="/auth/signin?callbackUrl=/pricing">
                  <Button size="xl" className="min-h-[52px] px-8 rounded-2xl bg-gradient-to-br from-primary to-accent">
                    Start Free Trial →
                  </Button>
                </Link>
              )}
              <p className="text-sm text-gray-500 mt-4">
                No payment required • Start creating now
              </p>
            </div>
          </div>
        </Section>

        {/* Main Pricing Cards - 2 plans: Creator + Professional */}
        <Section background="white" padding="lg">
          <h2 className="text-2xl font-extrabold text-dark text-center mb-6">Upgrade for more</h2>
          <div className="pricing-container grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 w-full min-w-0">
            {PAID_PLAN_KEYS.map((key) => {
              const plan = PLANS[key]
              const isPopular = "badge" in plan && plan.badge
              return (
                <div
                  key={key}
                  className={`pricing-card bg-white rounded-2xl border-2 p-6 sm:p-8 relative overflow-hidden flex flex-col min-h-[520px] sm:min-h-[560px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${
                    isPopular
                      ? "border-primary shadow-[0_8px_32px_rgba(124,58,237,0.15)] ring-2 ring-primary/10"
                      : "border-gray-200 hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  {isPopular && "badge" in plan && plan.badge && (
                    <div className="card-ribbon absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {plan.badge}
                    </div>
                  )}
                  <div className="card-header mb-5">
                    {"icon" in plan && plan.icon && (
                      <span className="text-3xl block mb-2">{plan.icon}</span>
                    )}
                    <h2 className="text-xl font-bold text-dark">{plan.name}</h2>
                    <div className="price-display flex items-baseline gap-1 mt-2">
                      <span className="price-main text-3xl font-bold text-dark">
                        ${plan.price}
                      </span>
                      <span className="price-period text-gray-500 text-sm">
                        /month
                      </span>
                    </div>
                  </div>
                  <ul className="feature-list flex-1 space-y-2 text-sm text-gray-600 min-h-0">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6 flex flex-col gap-3">
                    {isLoggedIn ? (
                      <Button
                        fullWidth
                        size="lg"
                        className={`min-h-[48px] sm:min-h-[52px] rounded-2xl w-full ${
                          isPopular
                            ? "bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                        onClick={() => startCheckout(key)}
                        disabled={!!loading}
                      >
                        {loading === key ? "Loading…" : `Get ${plan.name}`}
                      </Button>
                    ) : (
                      <Link href={`/auth/signin?callbackUrl=/pricing&plan=${key}`} className="block w-full">
                        <Button
                          fullWidth
                          size="lg"
                          className={`min-h-[48px] sm:min-h-[52px] rounded-2xl w-full ${
                            isPopular
                              ? "bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700"
                              : "bg-gray-800 hover:bg-gray-700"
                          }`}
                        >
                          Get {plan.name}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* FAQ Section */}
        <Section background="white" padding="lg">
          <div className="faq-section max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark text-center mb-10 tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="faq-grid space-y-3">
              {[
                {
                  q: "How does the 7-day free trial work?",
                  a: "Sign up and start your free trial. You get 10 FREE video credits, 5 Genie edits, and all features unlocked. Create videos of any length; credits are based on duration (e.g. 1 min = 1 credit, 2 min = 2 credits). After 7 days you're charged $39/month (Creator plan) unless you cancel.",
                },
                {
                  q: "How do video credits work?",
                  a: "Credits scale with video length: 0–60 sec = 1 credit, 1–2 min = 2, 2–3 min = 3, 3–4 min = 4, 4–5 min = 5, and 5+ min = 1 credit per minute. No video length limits.",
                },
                {
                  q: "What are Genie Edits?",
                  a: "Genie is your AI script assistant. Each time you ask Genie to refine or improve a script (e.g. “make the hook stronger”), it uses 1 Genie edit. Trial includes 5; paid plans include more.",
                },
                {
                  q: "What makes your scripts viral?",
                  a: "Our AI analyzes over 50 million viral posts across YouTube, TikTok, Instagram, and Twitter to identify patterns in hooks, storytelling, pacing, and engagement. Each script is optimized for maximum views and shares based on proven viral content strategies.",
                },
                {
                  q: "What is the Viral Score?",
                  a: "Every script gets a Viral Score prediction based on proven engagement patterns. It helps you know what will perform before you post. Scripts with scores 80+ have a high chance of going viral.",
                },
                {
                  q: "Which platforms are supported?",
                  a: "Scripts are optimized for YouTube, TikTok, Instagram, Twitter/X, and LinkedIn. You get platform-specific formatting and hook styles for each.",
                },
                {
                  q: "How many script variations do I get?",
                  a: "On the paid plan you get 3 variations per script so you can A/B test what performs best. The free trial includes 1 variation per script.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely! Cancel your subscription anytime from your dashboard. No cancellation fees, no questions asked.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 min-h-[56px] sm:min-h-[52px] text-left font-medium text-dark hover:bg-gray-50 transition-colors duration-200"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 shrink-0 ml-3 transition-transform duration-200 ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Trust Signals */}
        <Section background="light" padding="md">
          <div className="trust-section">
            <div className="trust-badges flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="trust-badge flex items-center gap-2">
                <span className="badge-icon">🔒</span>
                <span className="badge-text">Secure Payment</span>
              </div>
              <div className="trust-badge flex items-center gap-2">
                <span className="badge-icon">✓</span>
                <span className="badge-text">Cancel Anytime</span>
              </div>
              <div className="trust-badge flex items-center gap-2">
                <span className="badge-icon">💳</span>
                <span className="badge-text">No Hidden Fees</span>
              </div>
              <div className="trust-badge flex items-center gap-2">
                <span className="badge-icon">🎁</span>
                <span className="badge-text">7-Day Free Trial</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <Section background="dark" padding="lg">
          <div className="pricing-final-cta text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
              Ready to Create Viral Videos?
            </h2>
            <p className="cta-description text-gray-300 mb-8 text-lg leading-relaxed">
              Start free with 5 video credits. Upgrade to Creator ($39) or Professional ($79).
            </p>
            <Link href="/onboarding" className="inline-block w-full sm:w-auto">
              <Button size="xl" className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.4)] hover:from-purple-500 hover:via-violet-500 hover:to-purple-600 transition-all duration-200">
                Start Free Trial
              </Button>
            </Link>
            <p className="cta-fine-print text-gray-400 text-sm mt-6">
              Cancel anytime • No hidden fees • Secure payment
            </p>
          </div>
        </Section>
      </div>

      <Footer />
    </div>
  )
}
