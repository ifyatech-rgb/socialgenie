"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import Navbar from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { PLANS, type PlanKey } from "@/lib/plans"

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const planKeys: PlanKey[] = ["trial", "creator", "professional", "enterprise"]

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="pricing-page pt-16 lg:pt-24">
        {/* Header */}
        <Section background="white" padding="lg">
          <div className="pricing-header text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="subtitle text-xl text-gray-600 mb-2">
              Start free for 7 days • Creator $39 • Pro $79 • Enterprise $199
            </p>
            <p className="no-commitment text-gray-500 text-sm">
              Cancel anytime • No hidden fees • No contracts
            </p>
          </div>
        </Section>

        {/* Main Pricing Cards */}
        <Section background="light" padding="lg">
          <div className="pricing-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {planKeys.map((key) => {
              const plan = PLANS[key]
              const isTrial = key === "trial"
              const isPopular = "badge" in plan && plan.badge
              return (
                <div
                  key={key}
                  className={`pricing-card bg-white rounded-2xl border-2 p-6 relative overflow-hidden flex flex-col ${
                    isPopular
                      ? "border-primary shadow-xl shadow-primary/10"
                      : isTrial
                        ? "border-gray-200"
                        : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  {isTrial && (
                    <div className="card-ribbon absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      FREE TRIAL
                    </div>
                  )}
                  {isPopular && "badge" in plan && plan.badge && (
                    <div className="card-ribbon absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {plan.badge}
                    </div>
                  )}
                  <div className="card-header mb-4">
                    {"icon" in plan && plan.icon && (
                      <span className="text-3xl block mb-2">{plan.icon}</span>
                    )}
                    <h2 className="text-xl font-bold text-dark">{plan.name}</h2>
                    <div className="price-display flex items-baseline gap-1 mt-2">
                      <span className="price-main text-3xl font-bold text-dark">
                        ${plan.price}
                      </span>
                      <span className="price-period text-gray-500 text-sm">
                        {isTrial ? " for 7 days" : "/month"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={isTrial ? "/auth/signup" : `/auth/signup?plan=${key}`}
                    className="block mt-auto"
                  >
                    <Button
                      fullWidth
                      size="lg"
                      className={isPopular ? "" : "bg-gray-800 hover:bg-gray-700"}
                    >
                      {isTrial ? "Start Free Trial" : key === "enterprise" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </Link>
                  <ul className="feature-list space-y-2 text-sm text-gray-600 mt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </Section>

        {/* FAQ Section */}
        <Section background="white" padding="lg">
          <div className="faq-section max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-dark text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="faq-grid space-y-4">
              {[
                {
                  q: "How does the 7-day free trial work?",
                  a: "Sign up to start your free trial. You get 3 video credits, 5 Genie script edits, unlimited AI script generation, and 1 custom avatar upload. Videos are watermarked. Cancel anytime during the trial.",
                },
                {
                  q: "How do video credits work?",
                  a: "Each video costs 1–5 credits based on length: 0–60 sec = 1 credit, 61–120 sec = 2, 121–180 sec = 3, longer = 5. Shorter videos use fewer credits.",
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
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-dark hover:bg-gray-50 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-gray-600 text-sm">{faq.a}</div>
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
          <div className="pricing-final-cta text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Create Viral Videos?
            </h2>
            <p className="cta-description text-gray-300 mb-6 text-lg">
              Start free with 3 video credits & 5 Genie edits. Upgrade to Creator ($39), Pro ($79), or Enterprise ($199).
            </p>
            <Link href="/auth/signup">
              <Button size="xl">Start Free Trial</Button>
            </Link>
            <p className="cta-fine-print text-gray-400 text-sm mt-4">
              Cancel anytime • No hidden fees • Secure payment
            </p>
          </div>
        </Section>
      </div>

      <Footer />
    </div>
  )
}
