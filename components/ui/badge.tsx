"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-gray-100 text-gray-700",
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary",
      success: "bg-green-100 text-green-700",
      warning: "bg-amber-100 text-amber-700",
      error: "bg-red-100 text-red-700",
      outline: "bg-transparent border-2 border-gray-200 text-gray-700",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              variant === "success" && "bg-green-500",
              variant === "warning" && "bg-amber-500",
              variant === "error" && "bg-red-500",
              variant === "primary" && "bg-primary",
              variant === "secondary" && "bg-secondary",
              variant === "default" && "bg-gray-500"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Platform Badge Component
interface PlatformBadgeProps {
  platform: "TikTok" | "Instagram" | "YouTube" | string;
  className?: string;
  showIcon?: boolean;
}

const PlatformBadge = ({ platform, className, showIcon = true }: PlatformBadgeProps) => {
  const platformStyles = {
    TikTok: {
      className: "bg-gradient-to-r from-pink-500/10 to-cyan-500/10 text-gray-800 border border-pink-200/50",
      icon: "🎵",
    },
    Instagram: {
      className: "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-gray-800 border border-purple-200/50",
      icon: "📸",
    },
    YouTube: {
      className: "bg-red-100 text-red-700 border border-red-200/50",
      icon: "▶️",
    },
  };

  const style = platformStyles[platform as keyof typeof platformStyles] || {
    className: "bg-gray-100 text-gray-700",
    icon: "📱",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
        style.className,
        className
      )}
    >
      {showIcon && <span>{style.icon}</span>}
      {platform}
    </span>
  );
};

// Tone Badge Component
interface ToneBadgeProps {
  tone: "Educational" | "Entertaining" | "Motivational" | "Controversial" | string;
  className?: string;
}

const ToneBadge = ({ tone, className }: ToneBadgeProps) => {
  const toneStyles = {
    Educational: { className: "bg-blue-100 text-blue-700", icon: "🎓" },
    Entertaining: { className: "bg-yellow-100 text-yellow-700", icon: "🎭" },
    Motivational: { className: "bg-orange-100 text-orange-700", icon: "💪" },
    Controversial: { className: "bg-red-100 text-red-700", icon: "🔥" },
  };

  const style = toneStyles[tone as keyof typeof toneStyles] || {
    className: "bg-gray-100 text-gray-700",
    icon: "📝",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
        style.className,
        className
      )}
    >
      <span>{style.icon}</span>
      {tone}
    </span>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: "draft" | "generated" | "processing" | "completed" | "failed";
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusStyles = {
    draft: { className: "bg-gray-100 text-gray-700", label: "Draft" },
    generated: { className: "bg-green-100 text-green-700", label: "Generated" },
    processing: { className: "bg-blue-100 text-blue-700", label: "Processing" },
    completed: { className: "bg-green-100 text-green-700", label: "Completed" },
    failed: { className: "bg-red-100 text-red-700", label: "Failed" },
  };

  const style = statusStyles[status] || statusStyles.draft;

  return (
    <Badge
      dot
      variant={
        status === "generated" || status === "completed"
          ? "success"
          : status === "processing"
          ? "primary"
          : status === "failed"
          ? "error"
          : "default"
      }
      className={className}
    >
      {style.label}
    </Badge>
  );
};

export { Badge, PlatformBadge, ToneBadge, StatusBadge };
