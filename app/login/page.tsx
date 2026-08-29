"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PortalConfig {
  id: UserRole;
  title: string;
  name: string;
  icon: string;
  badge: string;
  accentColor: string;
  badgeVariant: "coral" | "purple" | "info" | "warning" | "success";
  description: string;
}

const PORTALS: PortalConfig[] = [
  {
    id: "super_admin",
    title: "Super Admin Portal",
    name: "Master Control",
    icon: "👑",
    badge: "Master Access",
    accentColor: "sky",
    badgeVariant: "coral",
    description: "Full master administrative access with role delegation, user provisioning, and organizational configuration.",
  },
  {
    id: "hr_admin",
    title: "HR Admin Portal",
    name: "HR Operations",
    icon: "💼",
    badge: "HR Operations",
    accentColor: "indigo",
    badgeVariant: "info",
    description: "Workforce directory, attendance records, leave approvals, and employee onboarding.",
  },

  {
    id: "manager",
    title: "Team Manager Portal",
    name: "Team Operations",
    icon: "👔",
    badge: "Team Management",
    accentColor: "amber",
    badgeVariant: "warning",
    description: "Department attendance oversight, shift tracking, and team leave approvals.",
  },
  {
    id: "employee",
    title: "Employee Portal (ESS)",
    name: "Self-Service",
    icon: "👩‍💻",
    badge: "Self-Service",
    accentColor: "emerald",
    badgeVariant: "success",
    description: "View payslips, check in/out, submit leave requests, and apply for expense claims.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [activePortal, setActivePortal] = useState<UserRole>("super_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const selectedPortal = PORTALS.find((p) => p.id === activePortal) || PORTALS[0];

  const handleSelectPortal = (portal: PortalConfig) => {
    setActivePortal(portal.id);
    setLoginError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !password) {
      toastError("Missing Fields", "Please enter your registered email and password.");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password, activePortal);
    setIsLoading(false);

    if (res.success) {
      success("Authenticated Successfully", "Welcome to Coralgenz.");
      router.push("/dashboard");
    } else {
      const errMsg = res.error || "Invalid credentials or unauthorized portal access.";
      setLoginError(errMsg);
      toastError("Authentication Failed", errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-800 selection:bg-sky-100 selection:text-sky-900">
      {/* Decorative Soft Geometric / Mesh Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-rose-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        {/* Logo Container with Soft Shadow & Border */}
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white p-2.5 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/10 border border-slate-200/80 transition-transform duration-300 hover:scale-105">
          <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-sky-200/80 shadow-xs mb-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">
              Enterprise Identity & Payroll Platform
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Coralgenz Payrole
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-sm mx-auto mt-1">
            Secure cloud access for HR, management, and workforce teams
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.09)] rounded-3xl overflow-hidden transition-all">
          
          {/* Top Portal Selection Ribbon */}
          <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Dedicated Login Portal
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Role-Based Permission Layer
              </span>
            </div>
            
            <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto no-scrollbar touch-scroll pb-1 sm:pb-0">
              {PORTALS.map((portal) => {
                const isActive = activePortal === portal.id;
                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => handleSelectPortal(portal)}
                    className={`py-2 px-2.5 sm:px-2 rounded-xl text-left transition-all border shrink-0 sm:shrink min-w-[135px] sm:min-w-0 ${
                      isActive
                        ? "bg-white border-sky-500 text-sky-950 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20 font-bold"
                        : "bg-white/60 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                      <span className="text-sm">{portal.icon}</span>
                      <span className="truncate">{portal.title.replace(" Portal", "")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                      {portal.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Active Portal Info Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/90 via-indigo-50/50 to-white border border-sky-100 flex items-start gap-3.5 shadow-xs">
              <div className="text-2xl p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm shrink-0 flex items-center justify-center">
                {selectedPortal.icon}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedPortal.title}
                  </h3>
                  <Badge variant={selectedPortal.badgeVariant} size="sm" className="text-[10px] px-2 py-0.5">
                    {selectedPortal.badge}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedPortal.description}
                </p>
              </div>
            </div>

            {/* Error / Enrollment Notice */}
            {loginError && (
              <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Enrolment & Authentication Notice</span>
                </div>
                <p className="text-rose-700 leading-relaxed pl-6">
                  {loginError}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registered Corporate Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employee@coralgenz.co.in"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Portal Access Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  {activePortal === "super_admin"
                    ? "Super Admin accounts have full permissions to switch between departments and views in-session."
                    : "Individual staff access is strictly authorized and managed by the Super Administrator."}
                </span>
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-600/20 active:scale-[0.99] transition-all min-h-[46px] text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to {selectedPortal.title}
              </Button>
            </form>
          </div>
        </div>

        {/* Trust Badges & Corporate Footer */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              256-Bit SSL Encrypted
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              SOC-2 Type II Certified Cloud
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Firebase Security Rules Active
            </span>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 Coralgenz Technologies Pvt. Ltd. • All Rights Reserved
          </p>

          <div className="flex justify-center gap-4 text-xs text-slate-500">
            <Link href="/onboarding" className="hover:text-sky-600 underline transition-colors">
              Organization Setup
            </Link>
            <span>•</span>
            <Link href="/verify-email" className="hover:text-sky-600 underline transition-colors">
              Verify Account
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-sky-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
