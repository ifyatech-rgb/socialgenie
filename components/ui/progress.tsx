"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: "default" | "gradient" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const ProgressBar = ({
  value,
  max = 100,
  showLabel = false,
  label,
  variant = "gradient",
  size = "md",
  animated = false,
  className,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    default: "bg-gray-600",
    gradient: "bg-gradient-to-r from-primary to-secondary",
    success: "bg-gradient-to-r from-green-500 to-emerald-500",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500",
    error: "bg-gradient-to-r from-red-500 to-rose-500",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || "Progress"}
          </span>
          {showLabel && (
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  variant?: "default" | "gradient" | "success" | "warning" | "error";
  className?: string;
  children?: React.ReactNode;
}

const CircularProgress = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  showValue = true,
  variant = "gradient",
  className,
  children,
}: CircularProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    default: "#4B5563",
    gradient: "url(#gradient)",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          showValue && (
            <span className="text-lg font-bold text-gray-900">
              {Math.round(percentage)}%
            </span>
          )
        )}
      </div>
    </div>
  );
};

// Steps Progress Component
interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepsProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const StepsProgress = ({ steps, currentStep, className }: StepsProgressProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                  index < currentStep
                    ? "bg-gradient-to-r from-primary to-secondary text-white"
                    : index === currentStep
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {index < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    index <= currentStep ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 px-4">
                <div className="h-0.5 bg-gray-200 relative">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-300",
                      index < currentStep ? "w-full" : "w-0"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { ProgressBar, CircularProgress, StepsProgress };
