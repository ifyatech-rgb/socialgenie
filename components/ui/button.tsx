"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // Legacy props for backwards compatibility
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      icon,
      iconPosition = "left",
      fullWidth = false,
      glow = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Handle legacy icon props
    const resolvedLeftIcon = leftIcon || (icon && iconPosition === "left" ? icon : undefined);
    const resolvedRightIcon = rightIcon || (icon && iconPosition === "right" ? icon : undefined);

    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl",
      "transition-all duration-200 active:scale-[0.98]",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
      "focus:outline-none focus:ring-2 focus:ring-offset-2"
    );

    const variants = {
      primary: cn(
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-indigo-500"
      ),
      secondary: cn(
        "text-gray-900 bg-white border-2 border-gray-200",
        "hover:border-indigo-500 hover:text-indigo-500",
        "focus:ring-indigo-500"
      ),
      outline: cn(
        "bg-transparent border-2",
        "focus:ring-indigo-500"
      ),
      ghost: cn(
        "text-gray-600 bg-transparent",
        "hover:bg-gray-100 hover:text-gray-900",
        "focus:ring-gray-300"
      ),
      danger: cn(
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-red-500"
      ),
      success: cn(
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-green-500"
      ),
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
      icon: "p-2.5",
    };

    // Inline styles for gradients (since @apply doesn't work with custom colors)
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: "linear-gradient(to right, #6366F1, #8B5CF6)",
      },
      danger: {
        background: "linear-gradient(to right, #EF4444, #DC2626)",
      },
      success: {
        background: "linear-gradient(to right, #10B981, #059669)",
      },
      outline: {
        borderColor: "#6366F1",
        color: "#6366F1",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={variantStyles[variant]}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          glow && "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {resolvedLeftIcon && <span className="shrink-0">{resolvedLeftIcon}</span>}
            {children}
            {resolvedRightIcon && <span className="shrink-0">{resolvedRightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
