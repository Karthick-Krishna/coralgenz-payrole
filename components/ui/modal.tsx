"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Center Modal Container - Bottom sheet feeling on mobile */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-4 text-center">
        <div
          className={cn(
            "relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all w-full my-2 sm:my-8 border border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col",
            maxWidthStyles[maxWidth],
            className
          )}
        >
          {/* Mobile Handle indicator */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="space-y-1 pr-2">
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body with smooth scrolling */}
          <div className="p-4 sm:p-6 overflow-y-auto touch-scroll flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
