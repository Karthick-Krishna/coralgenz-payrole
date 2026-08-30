import React from "react";
import { FireLogoLoader } from "@/components/ui/fire-logo-loader";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/60 dark:bg-slate-950/60">
      <FireLogoLoader
        size="lg"
        message="Coralgenz Payroll Ignition"
        subMessage="Firing up cloud database & secure compliance calculations..."
      />
    </div>
  );
}
