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
        <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto shadow-2xl overflow-hidden animate-pulse">
          <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-lg font-bold">Coralgenz Payrole</h2>
        <p className="text-xs text-slate-400">Loading your corporate workspace...</p>
      </div>
    </div>
  );
}
