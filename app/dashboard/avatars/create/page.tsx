"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WizardLayout } from "@/components/avatar-wizard/WizardLayout";
import { TypeChoiceStep, type AvatarTypeChoice } from "@/components/avatar-wizard/TypeChoiceStep";
import { UploadStep } from "@/components/avatar-wizard/UploadStep";
import { ConsentStep } from "@/components/avatar-wizard/ConsentStep";
import { VerifyStep } from "@/components/avatar-wizard/VerifyStep";
import { useAvatarCreation } from "@/contexts/AvatarCreationContext";
import type { UploadedFile } from "@/components/avatar-wizard/UploadZone";

const STEPS = [1, 2, 3, 4] as const;
type StepId = (typeof STEPS)[number];

export default function CreateAvatarPage() {
  const router = useRouter();
  const ctx = useAvatarCreation();
  const [step, setStep] = useState<StepId>(1);
  const [avatarType, setAvatarType] = useState<AvatarTypeChoice>("photo");
  const [uploadFile, setUploadFile] = useState<UploadedFile | null>(null);
  const [uploadCanProceed, setUploadCanProceed] = useState(false);
  const [consentBlob, setConsentBlob] = useState<Blob | null>(null);
  const [consentCanProceed, setConsentCanProceed] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarNameOverride, setAvatarNameOverride] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = (ctx.userName || userName || avatarNameOverride || "My Avatar").trim();

  const isVideo = avatarType === "video";
  const skipConsentStep = !isVideo;
  const effectiveStep = skipConsentStep && step === 4 ? 4 : step;
  const showConsentStep = isVideo && step === 3;
  const showVerifyStep = step === 4;

  const canGoNext = useCallback(() => {
    if (step === 1) return true;
    if (step === 2) return uploadCanProceed;
    if (step === 3) return consentCanProceed;
    return true;
  }, [step, uploadCanProceed, consentCanProceed]);

  const handleNext = useCallback(() => {
    if (step < 4) {
      if (step === 2 && skipConsentStep) {
        setStep(4);
      } else {
        setStep((s) => Math.min(4, s + 1) as StepId);
      }
    }
  }, [step, skipConsentStep]);

  const handleBack = useCallback(() => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(skipConsentStep ? 2 : 3);
  }, [step, skipConsentStep]);

  const handleSubmit = useCallback(async () => {
    const name = displayName || "My Avatar";
    const file = ctx.mainVideoFile || uploadFile?.file;
    if (!file) {
      toast.error("Please upload a photo or video first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("avatarName", name);
      formData.set("avatarType", avatarType);
      formData.set("file", file);
      if (isVideo && ctx.consentVideoBlob) {
        formData.set(
          "consentVideo",
          new File([ctx.consentVideoBlob], "consent.webm", { type: ctx.consentVideoBlob.type || "video/webm" })
        );
      }
      const res = await fetch("/api/heygen/create-avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || data.error || "Failed to create avatar");
        return;
      }
      toast.success(data.message || "Avatar created! It may take a few minutes to process.");
      ctx.reset();
      router.push("/dashboard/avatars");
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [avatarType, ctx, userName, avatarNameOverride, uploadFile, isVideo, router, displayName]);

  return (
    <div className="min-h-screen bg-white">
      {step === 1 && (
        <WizardLayout
          step={1}
          onBack={() => router.push("/dashboard/avatars")}
          onNext={() => {
            setStep(2);
          }}
          nextLabel="Continue"
        >
          <TypeChoiceStep
            onSelect={(type) => {
              setAvatarType(type);
            }}
          />
        </WizardLayout>
      )}

      {step === 2 && (
        <WizardLayout
          step={2}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel="Continue"
          nextDisabled={!canGoNext()}
        >
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              {avatarType === "photo" ? "Upload your photo" : "Upload your video"}
            </h1>
            <p className="mb-6 text-gray-600">
              {avatarType === "photo"
                ? "Use a clear, well-lit photo with your face visible."
                : "Upload a 2–5 minute video with clear speech and good lighting."}
            </p>
            <UploadStep
              avatarType={avatarType}
              initialFile={uploadFile}
              onHaveFootage={setUploadFile}
              onCanProceedChange={setUploadCanProceed}
            />
          </div>
        </WizardLayout>
      )}

      {showConsentStep && (
        <WizardLayout
          step={3}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel="Continue"
          nextDisabled={!canGoNext()}
        >
          <ConsentStep
            userName={userName}
            onUserNameChange={setUserName}
            onConsentRecorded={(blob) => {
              setConsentBlob(blob ?? null);
            }}
            onCanCreateChange={setConsentCanProceed}
          />
        </WizardLayout>
      )}

      {showVerifyStep && (
        <WizardLayout
          step={4}
          onBack={handleBack}
          onNext={handleSubmit}
          nextLabel="Create Avatar"
          nextDisabled={!ctx.mainVideoUrl}
          isLoading={isSubmitting}
        >
          <div className="mx-auto max-w-5xl space-y-6">
            {!isVideo && !ctx.userName && !userName && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <label className="block text-sm font-medium text-gray-700">
                  Avatar name
                </label>
                <input
                  type="text"
                  value={avatarNameOverride}
                  onChange={(e) => setAvatarNameOverride(e.target.value)}
                  placeholder="e.g. My Avatar"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}
            <VerifyStep
              mainVideoUrl={ctx.mainVideoUrl}
              consentVideoUrl={ctx.consentVideoUrl}
              userName={displayName}
              mainFileName={ctx.mainVideoFileName}
              mainFileSize={ctx.mainVideoSize}
              mainDuration={ctx.mainVideoDuration}
              consentDuration={ctx.consentDuration}
              consentSize={ctx.consentSize}
              mediaType={avatarType}
            />
          </div>
        </WizardLayout>
      )}
    </div>
  );
}
