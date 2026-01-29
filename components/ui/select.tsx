"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

// Radio Card Component
interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface RadioCardGroupProps {
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

const RadioCardGroup = ({
  options,
  value,
  onChange,
  label,
  columns = 3,
  className,
}: RadioCardGroupProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          {label}
        </label>
      )}
      <div className={cn("grid gap-3", gridCols[columns])}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5",
              value === option.value
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-gray-200 bg-white"
            )}
          >
            {option.badge && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white rounded-full">
                {option.badge}
              </span>
            )}
            {option.icon && (
              <span className="text-2xl">{option.icon}</span>
            )}
            <span
              className={cn(
                "font-semibold text-sm",
                value === option.value ? "text-primary" : "text-gray-900"
              )}
            >
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-gray-500 text-center">
                {option.description}
              </span>
            )}
            {value === option.value && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Select Dropdown Component
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      placeholder = "Select an option",
      error,
      disabled,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div ref={ref} className={cn("relative", className)}>
        {label && (
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200",
            "bg-white text-left",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
            error
              ? "border-red-500 focus:border-red-500"
              : isOpen
              ? "border-primary ring-4 ring-primary/10"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <span
            className={cn(
              selectedOption ? "text-gray-900" : "text-gray-400"
            )}
          >
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && !disabled && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 z-20 mt-2 py-2 bg-white rounded-xl border border-gray-200 shadow-xl">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors",
                    "hover:bg-gray-50",
                    option.value === value && "bg-primary/5 text-primary"
                  )}
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

// Toggle Component
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const Toggle = ({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: ToggleProps) => {
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors duration-200",
          checked
            ? "bg-gradient-to-r from-primary to-secondary"
            : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200",
            checked && "translate-x-6"
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-900">{label}</span>
          )}
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
      )}
    </label>
  );
};

export { RadioCardGroup, Select, Toggle };
