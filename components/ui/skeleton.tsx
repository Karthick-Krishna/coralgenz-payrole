"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FireLogoLoader } from "./fire-logo-loader";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function PageLoader({
  message = "Igniting Enterprise Payroll...",
  subMessage = "Synchronizing live database records & compliance calculations",
  size = "md",
}: {
  message?: string;
  subMessage?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <FireLogoLoader message={message} subMessage={subMessage} size={size} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <FireLogoLoader
        size="md"
        message="Igniting Super Admin Operations..."
        subMessage="Fetching enterprise metrics, payroll runs, and headcount data"
      />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
