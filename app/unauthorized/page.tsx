"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  const { currentRole } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-slate-800 bg-slate-900 shadow-2xl text-center">
          <CardContent className="p-8 space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">403 - Access Prohibited</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                You do not have the necessary RBAC permissions for this resource under role: <span className="font-semibold text-white capitalize">{currentRole.replace("_", " ")}</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
              <Link href="/dashboard" className="w-full">
                <Button variant="coral" size="sm" className="w-full font-semibold" leftIcon={<Home className="w-4 h-4" />}>
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
