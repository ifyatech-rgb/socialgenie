"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Instructions" },
  { id: 2, label: "Submit footage" },
  { id: 3, label: "Consent" },
  { id: 4, label: "Verify" },
] as const;

export type WizardStepId = 1 | 2 | 3 | 4;

interface StepIndicatorProps {
  currentStep: WizardStepId;
  className?: string;
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn("flex items-center justify-center gap-0", className)}
    >
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive || isCompleted ? "text-[#000000]" : "text-[#9CA3AF]"
                )}
              >
                {step.label}
              </span>
              <div
                className={cn(
                  "mt-1 h-1 w-16 rounded-full transition-all duration-300 sm:w-24",
                  isActive || isCompleted ? "bg-[#000000]" : "bg-[#E5E7EB]"
                )}
              />
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-0.5 h-0.5 w-4 sm:w-8",
                  isCompleted ? "bg-[#000000]" : "bg-[#E5E7EB]"
                )}
                style={{ minWidth: 8 }}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
