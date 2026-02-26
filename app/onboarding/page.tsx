"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { X, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { LogoIcon } from "@/components/logo"

const QUESTIONS = [
  {
    id: "niche" as const,
    question: "What's your niche or industry?",
    type: "text" as const,
    placeholder: "e.g., Fitness, Business, Tech, Finance...",
    suggestions: ["Fitness", "Business", "Tech", "Finance", "Lifestyle", "Food", "Travel", "Fashion", "Gaming", "Education"],
  },
  {
    id: "platform" as const,
    question: "What platform do you post on most?",
    type: "choice" as const,
    options: [
      { value: "tiktok", label: "TikTok" },
      { value: "instagram", label: "Instagram Reels" },
      { value: "youtube", label: "YouTube Shorts" },
      { value: "multiple", label: "Multiple platforms" },
    ],
  },
  {
    id: "challenge" as const,
    question: "What's your biggest challenge?",
    type: "choice" as const,
    options: [
      { value: "camera_shy", label: "Don't like being on camera" },
      { value: "time", label: "Video creation takes too much time" },
      { value: "content", label: "Don't know what to write/say" },
      { value: "editing", label: "Editing is too complicated" },
    ],
  },
]

type AnswerKey = "niche" | "platform" | "challenge"

export default function OnboardingPage() {
  const router = useRouter()
  const { status } = useSession()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    niche: "",
    platform: "",
    challenge: "",
  })
  const [textInput, setTextInput] = useState("")

  // If authenticated and already completed onboarding, go to dashboard (skip onboarding for existing users)
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.onboardingCompleted) {
          router.replace("/dashboard")
        }
      })
      .catch(() => {})
  }, [status, router])

  const current = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1
  const value = current.type === "text" ? textInput.trim() : answers[current.id]
  const canProceed = Boolean(current.type === "text" ? textInput.trim() : answers[current.id])

  const setAnswer = (key: AnswerKey, val: string) => {
    setAnswers((prev) => ({ ...prev, [key]: val }))
  }

  const handleNext = (submitValue?: string) => {
    const val = submitValue ?? (current.type === "text" ? textInput.trim() : answers[current.id])
    if (!val) {
      toast.error("Please enter or select an option to continue.")
      return
    }
    if (current.type === "text") {
      setAnswer("niche", val)
    } else {
      setAnswer(current.id, val)
    }

    if (isLast) {
      handleSubmit({ ...answers, [current.id]: val })
      return
    }
    setStep((s) => s + 1)
    setTextInput("")
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))

  const handleSubmit = async (final: Record<string, string>) => {
    setLoading(true)
    try {
      const payload = {
        niche: final.niche || undefined,
        platform: final.platform || undefined,
        challenge: final.challenge || undefined,
      }
      if (status === "authenticated") {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Failed to save onboarding")
        toast.success("All set! Taking you to the dashboard…")
        router.push("/dashboard")
      } else {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("onboardingAnswers", JSON.stringify(payload))
        }
        toast.success("One more step — create your password.")
        router.push("/create-password")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (status === "authenticated") {
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      } catch {
        // continue to dashboard either way
      }
      router.push("/dashboard")
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("onboardingAnswers", JSON.stringify({}))
      }
      router.push("/create-password")
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
            onClick={handleSkip}
            className="absolute top-4 right-4 p-3 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 z-10"
            aria-label="Skip"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Question {step + 1} of {QUESTIONS.length}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              <LogoIcon size={40} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
              {current.question}
            </h1>

            <div className="min-h-[260px]">
              {current.type === "text" && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={current.placeholder}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && textInput.trim()) handleNext(textInput.trim())
                    }}
                    className="w-full px-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center text-lg"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-2 justify-center">
                    {current.suggestions!.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleNext(s)}
                        className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-primary hover:text-white text-sm font-medium transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {current.type === "choice" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.options!.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleNext(opt.value)}
                      disabled={loading}
                      className={`flex flex-col items-center justify-center min-h-[100px] p-6 rounded-xl border text-center transition-all ${
                        answers[current.id] === opt.value
                          ? "bg-primary/20 border-primary text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <span className="font-semibold text-sm sm:text-base">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 min-h-[52px] py-3 px-4 rounded-2xl border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              {current.type === "text" && (
                <button
                  type="button"
                  onClick={() => canProceed && handleNext()}
                  disabled={!canProceed || loading}
                  className="flex-1 min-h-[52px] py-3 px-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleSkip}
                className="min-h-[52px] py-3 px-4 rounded-2xl text-gray-400 hover:text-white font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
