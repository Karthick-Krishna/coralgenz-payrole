"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-slate-900 text-white">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-coral-500 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-glow animate-pulse">
          C
        </div>
        <h2 className="text-lg font-bold">Coralgenz Payrole</h2>
        <p className="text-xs text-slate-400">Loading your corporate workspace...</p>
      </div>
    </div>
  );
}
