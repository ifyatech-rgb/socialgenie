"use client";

import { forwardRef, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  characterCount?: boolean;
  maxCharacters?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      characterCount,
      maxCharacters,
      disabled,
      value,
      onChange,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [charCount, setCharCount] = useState(String(value || "").length);
    const generatedId = useId();
    const inputId = idProp ?? generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const inputType = type === "password" && showPassword ? "text" : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-gray-900 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-gray-200",
              "bg-white text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
              leftIcon && "pl-12",
              (rightIcon || showPasswordToggle || error) && "pr-12",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            {...props}
          />
          {error && !rightIcon && !showPasswordToggle && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {error ? (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : helperText ? (
            <p className="text-sm text-gray-500">{helperText}</p>
          ) : (
            <span />
          )}
          {characterCount && maxCharacters && (
            <p
              className={cn(
                "text-sm",
                charCount > maxCharacters ? "text-red-500" : "text-gray-400"
              )}
            >
              {charCount}/{maxCharacters}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  characterCount?: boolean;
  maxCharacters?: number;
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      characterCount,
      maxCharacters,
      autoResize,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(String(value || "").length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 border-gray-200",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
            "transition-all duration-200 resize-none",
            "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between mt-1.5">
          {error ? (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : helperText ? (
            <p className="text-sm text-gray-500">{helperText}</p>
          ) : (
            <span />
          )}
          {characterCount && maxCharacters && (
            <p
              className={cn(
                "text-sm",
                charCount > maxCharacters ? "text-red-500" : "text-gray-400"
              )}
            >
              {charCount}/{maxCharacters}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
