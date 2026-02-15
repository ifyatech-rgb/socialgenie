"use client";

import { cn } from "@/lib/utils";

const BRAND_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const STEPS = [
  { id: 1, label: "Choose Type" },
  { id: 2, label: "Upload" },
  { id: 3, label: "Consent" },
  { id: 4, label: "Submit" },
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
                  "text-xs font-medium transition-colors sm:text-sm",
                  isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
              <div
                className={cn(
                  "mt-1 h-1 w-12 rounded-full transition-all duration-300 sm:w-24",
                  isActive && "scale-105",
                  isActive || isCompleted ? "" : "bg-gray-200"
                )}
                style={
                  isActive || isCompleted
                    ? { background: isCompleted ? "#10B981" : BRAND_GRADIENT }
                    : undefined
                }
              />
            </div>
            {!isLast && (
              <div
                className={cn("mx-0.5 h-0.5 w-2 sm:w-6", isCompleted ? "bg-emerald-500" : "bg-gray-200")}
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
