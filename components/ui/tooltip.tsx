"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipContext = React.createContext<{ delayDuration: number }>({
  delayDuration: 200,
});

export function TooltipProvider({
  children,
  delayDuration = 200,
}: TooltipProviderProps) {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

export interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export interface TooltipTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface TooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

const TooltipContextInner = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerId: string;
} | null>(null);

export function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentId = React.useId();
  const triggerId = React.useId();

  const handleOpen = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
  }, [delayDuration]);

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
  }, []);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <TooltipContextInner.Provider
      value={{ open, setOpen: (o) => (o ? handleOpen() : handleClose()), contentId, triggerId }}
    >
      <div
        className="relative inline-flex"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        {children}
      </div>
    </TooltipContextInner.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  TooltipTriggerProps
>(function TooltipTrigger({ className, children, asChild, ...props }, ref) {
  return (
    <div ref={ref} className={cn("inline-flex", className)} {...props}>
      {children}
    </div>
  );
});

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps
>(function TooltipContent(
  {
    className,
    side = "top",
    sideOffset = 4,
    align = "center",
    children,
    ...props
  },
  ref
) {
  const ctx = React.useContext(TooltipContextInner);
  if (!ctx?.open) return null;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  const alignClasses = {
    start: "origin-left",
    center: "origin-center",
    end: "origin-right",
  };

  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border border-gray-200 bg-gray-900 px-3 py-1.5 text-sm text-gray-50 shadow-md",
        positionClasses[side],
        alignClasses[align],
        className
      )}
      style={{ marginTop: side === "top" ? -sideOffset : undefined, marginBottom: side === "bottom" ? -sideOffset : undefined, marginLeft: side === "left" ? -sideOffset : undefined, marginRight: side === "right" ? -sideOffset : undefined }}
      {...props}
    >
      {children}
    </div>
  );
});
