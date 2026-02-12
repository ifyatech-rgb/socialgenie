"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
              Try free for 7 days, then just $19/month
            </p>
            <p className="no-commitment text-gray-500 text-sm">
              Cancel anytime • No hidden fees • No contracts
            </p>
          </div>
        </Section>

        {/* Main Pricing Cards */}
        <Section background="light" padding="lg">
          <div className="pricing-container grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* TRIAL CARD */}
            <div className="pricing-card trial-card bg-white rounded-2xl border-2 border-gray-200 p-8 relative overflow-hidden">
              <div className="card-ribbon absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                FREE TRIAL
              </div>
              <div className="card-header mb-6">
                <h2 className="text-2xl font-bold text-dark mb-2">7-Day Free Trial</h2>
                <div className="price-display flex items-baseline gap-2 mb-2">
                  <span className="price-main text-4xl font-bold text-dark">$0</span>
                  <span className="price-period text-gray-500">for 7 days</span>
                </div>
                <p className="card-description text-gray-600 text-sm">
                  Test the platform risk-free
                </p>
              </div>

              <Link href="/auth/signup" className="block mb-6">
                <Button fullWidth size="lg">
                  Start Writing Scripts
                </Button>
              </Link>

              <div className="card-features space-y-6">
                <div className="feature-group">
                  <h3 className="font-semibold text-dark mb-3">Trial Includes:</h3>
                  <ul className="feature-list space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      10 viral scripts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      All platforms (YouTube, TikTok, Instagram, Twitter)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Viral score analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Basic trending topics
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      1 script variation per script
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PAID CARD (FEATURED) */}
            <div className="pricing-card paid-card featured bg-white rounded-2xl border-2 border-primary p-8 relative overflow-hidden shadow-xl shadow-primary/10">
              <div className="card-ribbon absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              <div className="card-header mb-6">
                <h2 className="text-2xl font-bold text-dark mb-2">Starter Plan</h2>
                <div className="price-display flex items-baseline gap-0.5 mb-2">
                  <span className="price-currency text-2xl text-gray-500">$</span>
                  <span className="price-main text-5xl font-bold text-dark">19</span>
                  <span className="price-period text-gray-500 text-lg">/month</span>
                </div>
                <p className="card-description text-gray-600 text-sm">
                  Everything you need to write viral scripts for social media
                </p>
              </div>

              <Link href="/auth/signup" className="block mb-2">
                <Button fullWidth size="lg">
                  Start Writing Scripts
                </Button>
              </Link>
              <p className="card-subtext text-center text-gray-500 text-sm mb-6">
                Try free for 7 days first
              </p>

              <div className="card-features space-y-6">
                <div className="feature-group">
                  <h3 className="font-semibold text-dark mb-3">What&apos;s included:</h3>
                  <ul className="feature-list space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2 emphasized">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <strong>50 viral scripts per month</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Multi-platform optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Viral score predictions
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Real-time trending topics (24/7)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Competitor analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      3 script variations per script
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Viral hook templates
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      Export: TXT, PDF, Notion, Google Docs
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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
                  a: "Sign up with your credit card. You won't be charged during the 7-day trial. Get 10 viral scripts and full access to all platforms. After 7 days, you'll be charged $19 and get full access. Cancel anytime during the trial to avoid charges.",
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
              Ready to Write Scripts That Go Viral?
            </h2>
            <p className="cta-description text-gray-300 mb-6 text-lg">
              Try free for 7 days. 50 scripts/month. Viral score predictions. Just results.
            </p>
            <Link href="/auth/signup">
              <Button size="xl">Start Writing Scripts</Button>
            </Link>
            <p className="cta-fine-print text-gray-400 text-sm mt-4">
              Then just $19/month • Cancel anytime • Secure payment
            </p>
          </div>
        </Section>
      </div>

      <Footer />
    </div>
  )
}
