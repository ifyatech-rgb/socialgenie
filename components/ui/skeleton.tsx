import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rectangle"
}

export function Skeleton({ className, variant = "rectangle", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        variant === "text" && "h-4 rounded",
        variant === "circle" && "rounded-full",
        variant === "rectangle" && "rounded-lg",
        className
      )}
      {...props}
    />
  )
}
