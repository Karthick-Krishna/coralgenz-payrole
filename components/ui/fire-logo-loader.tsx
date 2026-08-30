"use client";

import React from "react";
import { Flame, Sparkles } from "lucide-react";

interface FireLogoLoaderProps {
  message?: string;
  subMessage?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
  className?: string;
}

export function FireLogoLoader({
  message = "Igniting Enterprise Payroll Engine...",
  subMessage = "Synchronizing live calculations & secure server connections",
  size = "md",
  className = "",
}: FireLogoLoaderProps) {
  const isFullscreen = size === "fullscreen";

  // Particle positions & animation delays for rapid flame sparks
  const embers = [
    { left: "18%", delay: "0s", size: "w-2 h-2", color: "bg-amber-400" },
    { left: "32%", delay: "0.2s", size: "w-2.5 h-2.5", color: "bg-orange-500" },
    { left: "45%", delay: "0.45s", size: "w-1.5 h-1.5", color: "bg-rose-500" },
    { left: "58%", delay: "0.15s", size: "w-3 h-3", color: "bg-yellow-300" },
    { left: "70%", delay: "0.35s", size: "w-2 h-2", color: "bg-red-500" },
    { left: "82%", delay: "0.55s", size: "w-2.5 h-2.5", color: "bg-amber-300" },
    { left: "25%", delay: "0.7s", size: "w-1.5 h-1.5", color: "bg-orange-400" },
    { left: "62%", delay: "0.85s", size: "w-2 h-2", color: "bg-rose-400" },
  ];

  const logoDimension =
    size === "sm"
      ? "w-14 h-14"
      : size === "md"
      ? "w-20 h-20 sm:w-24 sm:h-24"
      : "w-28 h-28 sm:w-32 sm:h-32";

  const imgDimension =
    size === "sm"
      ? "w-8 h-8"
      : size === "md"
      ? "w-12 h-12 sm:w-14 sm:h-14"
      : "w-16 h-16 sm:w-20 sm:h-20";

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      
      {/* Rapid Fire Core Container */}
      <div className="relative flex items-center justify-center my-4">
        
        {/* Deep Ambient Fire Glow Background */}
        <div className="absolute -inset-6 sm:-inset-8 rounded-full bg-gradient-to-tr from-amber-500/40 via-orange-600/50 to-rose-600/40 blur-2xl animate-fire-flare-rapid pointer-events-none" />

        {/* Outer Plasma Flame Conic Ring (Rapid Clockwise) */}
        <div className="absolute -inset-3.5 sm:-inset-4.5 rounded-full p-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 animate-fire-spin-fast opacity-90 blur-[1px]">
          <div className="w-full h-full rounded-full bg-transparent" />
        </div>

        {/* Dynamic Fluid Flame Wave Distortion */}
        <div className="absolute -inset-2.5 sm:-inset-3 rounded-full bg-gradient-to-bl from-yellow-400 via-orange-600 to-red-600 animate-flame-wave opacity-75 blur-xs" />

        {/* Counter-Rotating Inner Fire Spark Ring (Rapid Counter-Clockwise) */}
        <div className="absolute -inset-1.5 sm:-inset-2 rounded-full p-[2px] border-2 border-dashed border-amber-300 animate-fire-spin-reverse-fast opacity-80" />

        {/* Rising Embers & Spark Particles */}
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {embers.map((ember, i) => (
            <span
              key={i}
              className={`absolute bottom-2 rounded-full ${ember.size} ${ember.color} animate-ember-rise shadow-[0_0_8px_rgba(245,158,11,0.9)]`}
              style={{
                left: ember.left,
                animationDelay: ember.delay,
              }}
            />
          ))}
        </div>

        {/* Center Logo Shield with Rapid Breathing Flare */}
        <div
          className={`relative ${logoDimension} rounded-3xl bg-white/95 dark:bg-slate-900/95 p-3 shadow-[0_0_35px_rgba(249,115,22,0.85)] border-2 border-amber-400/90 flex items-center justify-center animate-fire-logo-breathe backdrop-blur-md z-10`}
        >
          {/* Internal Fiery Vignette */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-orange-500/20 via-amber-400/10 to-transparent pointer-events-none" />
          
          {/* Company Logo with Fiery Drop Shadow */}
          <img
            src="/logo.png"
            alt="Coralgenz Fire Logo"
            className={`${imgDimension} object-contain filter drop-shadow-[0_0_12px_rgba(249,115,22,0.9)] transition-all`}
          />

          {/* Quick Corner Sparkle */}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-950" />
          </div>
        </div>
      </div>

      {/* Shimmering Fire Status Text */}
      {message && (
        <div className="space-y-1 mt-3 px-4 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-rose-500/15 border border-amber-300/40 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400 bg-clip-text text-transparent tracking-wide uppercase">
              {message}
            </span>
          </div>

          {subMessage && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto animate-pulse">
              {subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
