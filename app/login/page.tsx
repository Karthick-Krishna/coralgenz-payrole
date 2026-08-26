"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemoRole, isDemoMode } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("superadmin@coralgenz.com");
  const [password, setPassword] = useState("Coralgenz@2026");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError("Missing Fields", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      success("Welcome Back", "Successfully authenticated to Coralgenz Payrole.");
      router.push("/dashboard");
    } else {
      toastError("Login Failed", res.error || "Invalid login credentials.");
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    await loginAsDemoRole(role);
    setIsLoading(false);
    success(
      "Demo Session Started",
      `Logged in as ${role.replace("_", " ").toUpperCase()}`
    );
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      {/* Background glow graphics */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-coral-600 to-coral-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-glow">
          C
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Coralgenz Payrole
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Smart Payroll & Workforce Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0 space-y-6">
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@coralgenz.com"
                leftIcon={<Mail className="w-4 h-4" />}
                className="bg-slate-950/60 border-slate-700 text-white"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-coral-400 hover:text-coral-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="bg-slate-950/60 border-slate-700 text-white"
                />
              </div>

              <Button
                type="submit"
                variant="coral"
                isLoading={isLoading}
                className="w-full font-bold shadow-lg shadow-coral-500/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Workspace
              </Button>
            </form>

            {/* Quick Demo Switcher Container */}
            <div className="pt-5 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-coral-400" />
                  <span>1-Click Test Demo Roles:</span>
                </span>
                <Badge variant="coral" size="sm">
                  Instant Access
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("super_admin")}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all text-xs font-semibold text-slate-200"
                >
                  👑 Super Admin
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    Karthick Krishna
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("hr_admin")}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all text-xs font-semibold text-slate-200"
                >
                  💼 HR Admin
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    Meera Krishnan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("payroll_manager")}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all text-xs font-semibold text-slate-200"
                >
                  📊 Payroll Mgr
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    Rahul Menon
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("manager")}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all text-xs font-semibold text-slate-200"
                >
                  👔 Team Lead
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    Aarav Kumar
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("employee")}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all text-xs font-semibold text-slate-200 col-span-2 sm:col-span-2"
                >
                  👩‍💻 Employee Self-Service
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    Diya Raj (Punch in, Leaves, Payslips)
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Coralgenz Technologies Pvt. Ltd. • ISO/IEC 27001 Secure Payroll</p>
          <div className="flex justify-center gap-4 pt-1">
            <Link href="/onboarding" className="text-slate-400 hover:text-coral-400 underline">
              Organization Setup Wizard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
