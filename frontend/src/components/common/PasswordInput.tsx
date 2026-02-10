"use client";

/**
 * PasswordInput Component
 * Password input with show/hide toggle functionality
 */

import React, { useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function PasswordInput({
  label,
  error,
  helpText,
  id,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || props.name || "password";

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-light"
        >
          {label}
          {props.required && <span className="text-error"> *</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={`
            w-full px-4 py-2 pr-12 border rounded-lg min-h-11
            text-slate placeholder:text-slate-light/40
            border-slate/20
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            transition-all
            ${error ? "border-error bg-error/10" : ""}
            ${className}
          `}
          {...props}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-light hover:text-slate transition-colors p-1"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff size={20} strokeWidth={2} />
          ) : (
            <Eye size={20} strokeWidth={2} />
          )}
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {helpText && !error && (
        <p className="text-sm text-slate-light">{helpText}</p>
      )}
    </div>
  );
}
