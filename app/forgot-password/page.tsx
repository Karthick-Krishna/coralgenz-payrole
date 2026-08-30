"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, UserCheck, KeyRound, Mail, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-800 font-sans relative overflow-hidden">
      
      {/* Background Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 right-1/4 w-[30rem] h-[30rem] bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-3">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-white p-2.5 flex items-center justify-center mx-auto shadow-xl border border-slate-200/80">
          <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>Coralgenz</span>
          <span className="text-coral-500">Payroll</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500">
          Corporate Account Security & Identity Management
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="border-slate-200/90 bg-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-7 sm:p-9 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Contact Super Admin to Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Self-service password resets are restricted under enterprise security policies.
              </p>
            </div>

            {/* Security Notice Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm space-y-2">
              <p className="font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                Corporate RBAC Governance Policy
              </p>
              <p className="text-amber-800 leading-relaxed">
                Please contact your <strong>Super Admin</strong> or <strong>HR Administrator</strong>. They will verify your employee identity and issue a password reset directly from the Admin Management Console.
              </p>
            </div>

            {/* Admin Desk Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Administrator Desk:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  Super Admin / HR Desk
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Corporate Email:</span>
                <span className="font-mono font-bold text-sky-600">karthick@coralgenz.co.in</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">Turnaround Time:</span>
                <span className="font-semibold text-emerald-600">Instant Admin Reset</span>
              </div>
            </div>

            {/* Back to Login Action */}
            <div className="pt-2">
              <Button
                variant="coral"
                size="md"
                onClick={() => router.push("/login")}
                className="w-full font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Sign In
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
