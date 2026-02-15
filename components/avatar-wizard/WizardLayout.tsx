"use client";

import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { StepIndicator, type WizardStepId } from "./StepIndicator";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  step: WizardStepId;
  children: React.ReactNode;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}

export function WizardLayout({
  step,
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  isLoading = false,
}: WizardLayoutProps) {
  const isLastStep = step === 4;
  const primaryLabel = isLastStep ? "Create Avatar" : nextLabel;

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-4 md:px-8">
        <div className="flex w-20 justify-start">
          {step === 1 ? (
            <Link
              href="/dashboard/avatars"
              className="flex items-center gap-1 text-[#6B7280] hover:text-[#000000]"
              aria-label="Back to Avatars"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-[#6B7280] hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
        </div>

        <StepIndicator currentStep={step} className="flex-1 max-w-lg" />

        <div className="flex w-40 justify-end gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2.5 text-base font-medium text-[#374151] hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2"
              aria-label="Back"
            >
              Back
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed",
                nextDisabled || isLoading
                  ? "bg-gray-300 text-gray-500"
                  : "hover:opacity-90"
              )}
              style={nextDisabled || isLoading ? undefined : { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              aria-label={primaryLabel}
            >
              {isLoading ? (
                "…"
              ) : (
                <>
                  {primaryLabel}
                  {!isLastStep && <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <main
        className="px-4 py-10 md:px-8"
        style={{ padding: 40 }}
        role="main"
      >
        {children}
      </main>
    </div>
  );
}
