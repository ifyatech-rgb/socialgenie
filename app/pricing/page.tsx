"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import Navbar from "@/components/Navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { PLANS, type PlanKey } from "@/lib/plans"

const PAID_PLAN_KEYS: PlanKey[] = ["creator", "professional", "enterprise"]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="pricing-page pt-16 lg:pt-24">
        {/* Header */}
        <Section background="white" padding="lg">
          <div className="pricing-header text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-dark mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="subtitle text-xl text-gray-600 mb-3 leading-relaxed">
              Start free for 7 days • Creator $39 • Pro $79 • Enterprise $199
            </p>
            <p className="no-commitment text-gray-500 text-sm">
              Cancel anytime • No hidden fees • No contracts
            </p>
          </div>
        </Section>

        {/* Main Pricing Cards - 3 paid plans only, consistent height, aligned CTAs */}
        <Section background="light" padding="lg">
          <div className="pricing-container grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 w-full min-w-0">
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
                  {/* Aligned CTA block: same vertical position across all cards */}
                  <div className="mt-auto pt-6 flex flex-col gap-3">
                    <Link href="/auth/signup" className="block w-full">
                      <Button
                        fullWidth
                        variant="outline"
                        size="lg"
                        className="min-h-[48px] sm:min-h-[52px] rounded-2xl w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600"
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                    <Link
                      href={key === "enterprise" ? "/auth/signup?plan=enterprise" : `/auth/signup?plan=${key}`}
                      className="block w-full"
                    >
                      <Button
                        fullWidth
                        size="lg"
                        className={`min-h-[48px] sm:min-h-[52px] rounded-2xl w-full ${
                          isPopular
                            ? "bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.4)] hover:from-purple-500 hover:via-violet-500 hover:to-purple-600 transition-all duration-200"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        {key === "enterprise" ? "Contact Sales" : "Get Started"}
                      </Button>
                    </Link>
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
                  a: "Sign up to start your free trial. You get 3 video credits, 5 Genie script edits, unlimited AI script generation, and 1 custom avatar upload. Videos are watermarked. Cancel anytime during the trial.",
                },
                {
                  q: "How do video credits work?",
                  a: "Each video costs 1 to 5 credits based on length: 0 to 60 sec = 1 credit, 61 to 120 sec = 2, 121 to 180 sec = 3, longer = 5. Shorter videos use fewer credits.",
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
              Start free with 3 video credits & 5 Genie edits. Upgrade to Creator ($39), Pro ($79), or Enterprise ($199).
            </p>
            <Link href="/auth/signup" className="inline-block w-full sm:w-auto">
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
