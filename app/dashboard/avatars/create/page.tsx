"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WizardLayout } from "@/components/avatar-wizard/WizardLayout";
import type { WizardStepId } from "@/components/avatar-wizard/StepIndicator";
import { InstructionsStep } from "@/components/avatar-wizard/InstructionsStep";
import { UploadStep } from "@/components/avatar-wizard/UploadStep";
import { ConsentStep } from "@/components/avatar-wizard/ConsentStep";
import { VerifyStep } from "@/components/avatar-wizard/VerifyStep";
import type { UploadedFile } from "@/components/avatar-wizard/UploadZone";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CreateAvatarWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStepId>(1);
  const [footage, setFootage] = useState<UploadedFile | null>(null);
  const [step2CanProceed, setStep2CanProceed] = useState(false);
  const [userName, setUserName] = useState("");
  const [consentRecorded, setConsentRecorded] = useState(false);
  const [consentVideoUrl, setConsentVideoUrl] = useState<string>("");
  const [consentVideoBlob, setConsentVideoBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = useCallback(() => {
    if (step === 2) setStep(1);
    else if (step === 3) {
      setConsentRecorded(false);
      setConsentVideoUrl("");
      setConsentVideoBlob(null);
      setStep(2);
    } else if (step === 4) setStep(3);
  }, [step]);

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
      formData.set("avatarType", "video");
      formData.append("file", footage.file);
      if (consentVideoBlob && consentVideoBlob.size > 0) {
        formData.append(
          "consentVideo",
          new File([consentVideoBlob], "consent.webm", { type: consentVideoBlob.type || "video/webm" })
        );
      }

      const res = await authFetch("/api/heygen/create-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? "Creation failed");
      }
      toast.success("Avatar creation started. We'll notify you when it's ready.");
      router.push("/dashboard/avatars");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }, [footage, consentVideoBlob, userName, step, router]);

  return (
    <WizardLayout
      step={step}
      onBack={goBack}
      onNext={step === 4 ? handleCreateAvatar : goNext}
      nextDisabled={
        step === 2 ? !step2CanProceed : step === 3 ? !consentRecorded : false
      }
      isLoading={step === 4 && isSubmitting}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <InstructionsStep />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <UploadStep
              initialFile={footage}
              onHaveFootage={setFootage}
              onCanProceedChange={setStep2CanProceed}
            />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ConsentStep
              userName={userName}
              onUserNameChange={setUserName}
              onConsentRecorded={handleConsentRecorded}
              onCanCreateChange={() => {}}
            />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <VerifyStep
              mainVideoUrl={footage?.url ?? ""}
              consentVideoUrl={consentVideoUrl}
              userName={userName}
              mainFileName={footage?.file?.name}
              mainFileSize={footage?.file ? formatFileSize(footage.file.size) : undefined}
              consentSize={
                consentVideoBlob ? formatFileSize(consentVideoBlob.size) : undefined
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </WizardLayout>
  );
}
