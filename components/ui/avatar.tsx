"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  function Avatar({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    );
  }
);

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  AvatarImageProps
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <img
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  AvatarFallbackProps
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600",
        className
      )}
      {...props}
    />
  );
});

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface AvatarWithFallbackProps
  extends Omit<AvatarProps, "children"> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  name?: string;
}

export function AvatarWithFallback({
  src,
  alt,
  fallback,
  name,
  className,
  ...props
}: AvatarWithFallbackProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImg = src && !imgError;

  return (
    <Avatar className={className} {...props}>
      {showImg && (
        <AvatarImage
          src={src}
          alt={alt ?? name ?? "Avatar"}
          onError={() => setImgError(true)}
        />
      )}
      {(!showImg || imgError) && (
        <AvatarFallback>
          {fallback ?? (name ? getInitials(name) : "?")}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
