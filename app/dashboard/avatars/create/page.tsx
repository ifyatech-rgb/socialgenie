"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WizardLayout } from "@/components/avatar-wizard/WizardLayout";
import type { WizardStepId } from "@/components/avatar-wizard/StepIndicator";
import { TypeChoiceStep, type AvatarTypeChoice } from "@/components/avatar-wizard/TypeChoiceStep";
import { UploadStep } from "@/components/avatar-wizard/UploadStep";
import { ConsentStep } from "@/components/avatar-wizard/ConsentStep";
import { VerifyStep } from "@/components/avatar-wizard/VerifyStep";
import type { UploadedFile } from "@/components/avatar-wizard/UploadZone";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";

const BRAND_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CreateAvatarWizardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<WizardStepId>(1);
  const [avatarType, setAvatarType] = useState<AvatarTypeChoice>("video");
  const [footage, setFootage] = useState<UploadedFile | null>(null);
  const [step2CanProceed, setStep2CanProceed] = useState(false);
  const [userName, setUserName] = useState("");
  const [consentRecorded, setConsentRecorded] = useState(false);
  const [consentVideoUrl, setConsentVideoUrl] = useState<string>("");
  const [consentVideoBlob, setConsentVideoBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarLimit, setAvatarLimit] = useState<number>(1);
  const [avatarsUsed, setAvatarsUsed] = useState<number>(0);
  const [limitLoading, setLimitLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLimitLoading(false);
      return;
    }
    authFetch("/api/user", {}, session)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          setAvatarLimit(u.customAvatarsLimit ?? 1);
          setAvatarsUsed(u.customAvatarsUsed ?? u.customAvatarsCreated ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLimitLoading(false));
  }, [session]);

  const atLimit = avatarsUsed >= avatarLimit;

  const goBack = useCallback(() => {
    if (step === 2) setStep(1);
    else if (step === 3) {
      setConsentRecorded(false);
      setConsentVideoUrl("");
      setConsentVideoBlob(null);
      setStep(2);
    } else if (step === 4) setStep(3);
  }, [step]);

  const handleSelectType = useCallback((type: AvatarTypeChoice) => {
    setAvatarType(type);
    setStep(2);
  }, []);

  const goNext = useCallback(() => {
    if (step === 1) setStep(2);
    else if (step === 2 && step2CanProceed) setStep(3);
    else if (step === 3 && consentRecorded) setStep(4);
  }, [step, step2CanProceed, consentRecorded]);

  const handleConsentRecorded = useCallback((blob: Blob | null, url?: string) => {
    if (blob && url) {
      setConsentVideoBlob(blob);
      setConsentVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setConsentRecorded(true);
    } else {
      setConsentVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      setConsentVideoBlob(null);
      setConsentRecorded(false);
    }
  }, []);

  const handleCreateAvatar = useCallback(async () => {
    if (!footage?.file || step !== 4) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("avatarName", userName?.trim() || "My Avatar");
      formData.set("avatarType", avatarType);
      formData.append("file", footage.file);
      if (consentVideoBlob && consentVideoBlob.size > 0) {
        formData.append(
          "consentVideo",
          new File([consentVideoBlob], "consent.webm", { type: consentVideoBlob.type || "video/webm" })
        );
      }

      const res = await authFetch(
        "/api/heygen/create-avatar",
        { method: "POST", body: formData },
        session ?? undefined
      );

      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (text.trim().length > 0 && !text.trimStart().startsWith("<")) {
          data = JSON.parse(text) as Record<string, unknown>;
        }
      } catch {
        data = { error: "InvalidResponse", message: "Server returned an invalid response. Please try again." };
      }

      if (!res.ok) {
        if (data?.code === "avatar_limit_reached") {
          toast.error((data?.message as string) ?? "Custom avatar limit reached. Upgrade to create more!");
          return;
        }
        throw new Error((data?.message as string) ?? (data?.error as string) ?? "Creation failed");
      }
      const processingTime = avatarType === "photo" ? "5 to 15 minutes" : "15 to 30 minutes";
      toast.success(`Avatar creation started (${processingTime}). We'll notify you when it's ready.`);
      setAvatarsUsed((prev) => prev + 1);
      router.push("/dashboard/avatars");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }, [footage, consentVideoBlob, userName, step, router, avatarType, session]);

  if (!limitLoading && atLimit) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div
          className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/80 p-6 shadow-sm"
          style={{ borderColor: "rgba(251, 191, 36, 0.3)" }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900">Custom Avatar Uploads</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {avatarsUsed}/{avatarLimit} used
            </span>
          </div>
          <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-amber-200/60 bg-white/60 p-8 text-center">
            <span className="text-6xl">🎭</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Avatar limit reached</h2>
              <p className="mt-2 text-gray-600">
                Free trial includes 1 custom avatar. Upgrade to create more custom avatars!
              </p>
            </div>
            <Link
              href="/pricing"
              className="rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ background: BRAND_GRADIENT }}
            >
              View plans & upgrade
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <section
        className="rounded-2xl px-4 py-10 text-center sm:px-6 sm:py-12"
        style={{
          background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
        }}
      >
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white"
          style={{ background: BRAND_GRADIENT }}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>Custom Avatar Creation</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem]">
          Create Your <span className="bg-clip-text text-transparent" style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Avatar</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[600px] text-base text-gray-600 sm:text-lg">
          Upload your photo or video to create a realistic AI avatar that speaks for you
        </p>
        <div className="mx-auto mt-8 grid max-w-[800px] grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: "💼", title: "Professional", desc: "Look polished in every video" },
            { icon: "⚡", title: "Save Time", desc: "No recording needed" },
            { icon: "🎯", title: "Authentic", desc: "It's actually you!" },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur-sm"
            >
              <div className="mb-3 text-4xl" aria-hidden>{b.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{b.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {!limitLoading && (
        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/50 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold text-gray-900">Custom Avatar Uploads</span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800">
              {avatarsUsed} / {avatarLimit} used · {Math.max(0, avatarLimit - avatarsUsed)} remaining
            </span>
          </div>
        </div>
      )}

      <WizardLayout
        step={step}
        onBack={goBack}
        onNext={step === 4 ? handleCreateAvatar : goNext}
        nextDisabled={
          step === 2 ? !step2CanProceed : step === 3 ? !consentRecorded : false
        }
        isLoading={step === 4 && isSubmitting}
      >
        <>
          {step === 1 && (
            <div key="step1" className="animate-fade-in">
              <TypeChoiceStep onSelect={handleSelectType} />
            </div>
          )}
          {step === 2 && (
            <div key="step2" className="animate-fade-in">
              <UploadStep
                initialFile={footage}
                onHaveFootage={setFootage}
                onCanProceedChange={setStep2CanProceed}
                avatarType={avatarType}
              />
            </div>
          )}
          {step === 3 && (
            <div key="step3" className="animate-fade-in">
              <ConsentStep
                userName={userName}
                onUserNameChange={setUserName}
                onConsentRecorded={handleConsentRecorded}
                onCanCreateChange={() => {}}
                onBack={() => {
                  setConsentRecorded(false);
                  setConsentVideoUrl("");
                  setConsentVideoBlob(null);
                  setStep(2);
                }}
              />
            </div>
          )}
          {step === 4 && (
            <div key="step4" className="animate-fade-in">
              <VerifyStep
                mainVideoUrl={footage?.url ?? ""}
                consentVideoUrl={consentVideoUrl}
                userName={userName}
                mainFileName={footage?.file?.name}
                mainFileSize={footage?.file ? formatFileSize(footage.file.size) : undefined}
                consentSize={
                  consentVideoBlob ? formatFileSize(consentVideoBlob.size) : undefined
                }
                mediaType={avatarType}
              />
            </div>
          )}
        </>
      </WizardLayout>
    </div>
  );
}
