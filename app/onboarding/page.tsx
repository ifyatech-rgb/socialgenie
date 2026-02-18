"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { X, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"

const STEPS = [
  {
    key: "describeYou",
    title: "What best describes you?",
    options: [
      "E-commerce brand",
      "SaaS founder",
      "Coach / Course creator",
      "Content creator",
      "Local business owner",
      "Marketing agency",
    ],
  },
  {
    key: "mainGoal",
    title: "What's your main goal right now?",
    options: [
      "Increase sales",
      "Grow social media",
      "Generate leads",
      "Launch a new product",
      "Automate content creation",
    ],
  },
  {
    key: "videosPerMonth",
    title: "How many videos do you want per month?",
    options: ["1 to 10", "10 to 30", "30 to 100", "100+"],
  },
  {
    key: "usedAiTools",
    title: "Have you used AI video tools before?",
    options: ["Yes, regularly", "Tried a few", "No, this is my first time"],
  },
  {
    key: "whenPlanningStart",
    title: "When are you planning to start?",
    options: ["Immediately", "This week", "Just exploring"],
  },
] as const

type FormKey = (typeof STEPS)[number]["key"]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<FormKey, string>>({
    describeYou: "",
    mainGoal: "",
    videosPerMonth: "",
    usedAiTools: "",
    whenPlanningStart: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signup")
      return
    }
  }, [status, router])

  const currentStepConfig = STEPS[step]
  const currentValue = form[currentStepConfig.key]
  const isFirstStep = step === 0
  const isLastStep = step === STEPS.length - 1
  const canProceed = Boolean(currentValue?.trim())

  const setValue = (key: FormKey) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleNext = () => {
    if (!canProceed) {
      toast.error("Please select an option to continue.")
      return
    }
    if (isLastStep) {
      handleSubmit()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1))
  }

  const handleSubmit = async () => {
    if (!canProceed && isLastStep) {
      toast.error("Please select an option to continue.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to save onboarding")
      }
      toast.success("All set! Taking you to pricing…")
      router.push("/pricing")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900/30">
        <div className="text-white font-medium">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full filter blur-[100px]" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="absolute top-4 right-4 p-3 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Step {step + 1} of {STEPS.length}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              <LogoIcon size={40} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              Almost there
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Answer a few questions so we can personalize your experience.
            </p>

            {/* One question per step */}
            <div className="min-h-[280px]">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                {currentStepConfig.title}
              </label>
              <div className="space-y-2">
                {currentStepConfig.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      currentValue === opt
                        ? "bg-primary/20 border-primary text-white"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentStepConfig.key}
                      value={opt}
                      checked={currentValue === opt}
                      onChange={() => setValue(currentStepConfig.key)(opt)}
                      className="sr-only"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 min-h-[52px] py-3 px-4 rounded-2xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || !canProceed}
                className={`min-h-[52px] py-3 px-6 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${!isFirstStep ? "flex-1" : "w-full"}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </span>
                ) : isLastStep ? (
                  <>
                    Finish
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
