"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "glass" | "bordered" | "elevated" | "dark";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  glow?: boolean;
  gradientBorder?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      hover = false,
      glow = false,
      gradientBorder = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-white border border-gray-100 shadow-lg",
      gradient: "bg-white border border-gray-100 shadow-lg relative overflow-hidden",
      glass: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl",
      bordered: "bg-white border-2 border-gray-200",
      elevated: "bg-white shadow-xl",
      dark: "bg-slate-800/90 border border-slate-700 text-white",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variants[variant],
          paddings[padding],
          hover && "hover:-translate-y-1 hover:shadow-xl cursor-pointer",
          glow && "hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]",
          gradientBorder && "gradient-border",
          className
        )}
        {...props}
      >
        {variant === "gradient" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-bold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  chart?: React.ReactNode;
  className?: string;
}

const StatsCard = ({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  chart,
  className,
}: StatsCardProps) => {
  const changeColors = {
    positive: "text-green-600 bg-green-50",
    negative: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50",
  };

  return (
    <Card variant="gradient" hover className={cn("", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-2",
                changeColors[changeType]
              )}
            >
              {changeType === "positive" && "↑"}
              {changeType === "negative" && "↓"}
              {change}
            </span>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-indigo-500" style={{ background: "linear-gradient(to bottom right, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))" }}>
            {icon}
          </div>
        )}
      </div>
      {chart && <div className="mt-4 h-16">{chart}</div>}
    </Card>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatsCard };
