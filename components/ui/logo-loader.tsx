"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  text?: string;
  className?: string;
  showText?: boolean;
}

export function LogoLoader({
  size = "md",
  text,
  className,
  showText = true,
}: LogoLoaderProps) {
  const containerSizes = {
    xs: "w-7 h-7",
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    full: "w-36 h-36",
  };

  const logoSizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-9 h-9",
    lg: "w-13 h-13",
    xl: "w-18 h-18",
    full: "w-20 h-20",
  };

  const isFullPage = size === "full" || size === "xl";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center relative select-none",
        isFullPage ? "min-h-[220px] p-6" : "p-1.5",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Rapid Fiery Ambient Backlight Aura */}
        <div
          className={cn(
            "absolute rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-red-600 blur-xl opacity-85 animate-fire-glow-pulse pointer-events-none",
            containerSizes[size]
          )}
        />

        {/* Rapidly Spinning Fiery Outer Flame Ring */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-transparent border-t-amber-400 border-r-orange-500 border-b-red-600 border-l-yellow-400 animate-fire-ring-spin shadow-[0_0_20px_rgba(245,158,11,0.7)] pointer-events-none",
            containerSizes[size]
          )}
        />

        {/* Dynamic Floating Fiery Embers */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <span className="absolute -top-1 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-400 blur-[0.5px] animate-fire-ember-1" />
          <span className="absolute -top-2 right-1/4 w-2 h-2 rounded-full bg-orange-500 blur-[0.5px] animate-fire-ember-2" />
          <span className="absolute top-0 right-1/3 w-1.5 h-1.5 rounded-full bg-red-500 blur-[0.5px] animate-fire-ember-3" />
        </div>

        {/* Company Logo Badge with Rapid Rolling & Tumbling Animation */}
        <div
          className={cn(
            "relative rounded-2xl bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl border border-amber-300 dark:border-amber-700/80 flex items-center justify-center z-10 animate-fire-roll shadow-[0_0_25px_rgba(255,69,0,0.5)]",
            containerSizes[size]
          )}
        >
          <img
            src="/logo.png"
            alt="Coralgenz Loading Logo"
            className={cn("object-contain drop-shadow-md", logoSizes[size])}
          />
        </div>
      </div>

      {/* Optional Animated Text Label */}
      {showText && (text || isFullPage) && (
        <div className="mt-4 text-center space-y-1 z-10">
          <p className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-orange-600 via-amber-500 to-red-600 bg-clip-text text-transparent tracking-wide animate-gradient-flow uppercase">
            {text || "Loading Coralgenz System..."}
          </p>
          {isFullPage && (
            <p className="text-[11px] text-slate-400 font-medium">
              Authenticating credentials & synchronizing database records...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PageLogoLoader({ text }: { text?: string }) {
  return (
    <div className="min-h-[380px] w-full flex items-center justify-center p-6">
      <LogoLoader size="full" text={text} />
    </div>
  );
}
