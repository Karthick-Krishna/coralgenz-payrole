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
  Sparkles,
  Zap,
  Building2,
  FileCheck,
  Users,
  Shield,
  HelpCircle,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";

interface PortalConfig {
  id: UserRole;
  title: string;
  shortTitle: string;
  name: string;
  icon: string;
  badge: string;
  accentGradient: string;
  badgeVariant: "coral" | "purple" | "info" | "warning" | "success";
  description: string;
  demoEmail: string;
  demoPass: string;
}

const PORTALS: PortalConfig[] = [
  {
    id: "super_admin",
    title: "Super Admin Portal",
    shortTitle: "Super Admin",
    name: "Master Control",
    icon: "👑",
    badge: "Master Access",
    accentGradient: "from-sky-500 to-blue-600",
    badgeVariant: "coral",
    description: "Master administrative control with complete access to payroll locking, user provisioning, and company settings.",
    demoEmail: "karthick@coralgenz.co.in",
    demoPass: "Coralgenz@2026",
  },
  {
    id: "hr_admin",
    title: "HR Admin Portal",
    shortTitle: "HR Admin",
    name: "Workforce & Payroll",
    icon: "💼",
    badge: "HR Operations",
    accentGradient: "from-indigo-500 to-violet-600",
    badgeVariant: "info",
    description: "Employee onboarding, leave approvals, attendance records, and monthly salary processing.",
    demoEmail: "thanvanth@coralgenz.co.in",
    demoPass: "Coralgenz@2026",
  },
  {
    id: "manager",
    title: "Team Manager Portal",
    shortTitle: "Manager",
    name: "Team Operations",
    icon: "👔",
    badge: "Team Oversight",
    accentGradient: "from-amber-500 to-orange-600",
    badgeVariant: "warning",
    description: "Department attendance oversight, shift tracking, and team leave approvals.",
    demoEmail: "sharveshwaran.r@coralgenz.co.in",
    demoPass: "Coralgenz@2026",
  },
  {
    id: "employee",
    title: "Employee Portal (ESS)",
    shortTitle: "Employee",
    name: "Self-Service",
    icon: "👩‍💻",
    badge: "Self-Service ESS",
    accentGradient: "from-emerald-500 to-teal-600",
    badgeVariant: "success",
    description: "View sealed payslips, check in/out, submit leave requests, and apply for expense claims.",
    demoEmail: "sowmiya@coralgenz.co.in",
    demoPass: "Coralgenz@2026",
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
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [justFilledDemo, setJustFilledDemo] = useState<string | null>(null);

  const selectedPortal = PORTALS.find((p) => p.id === activePortal) || PORTALS[0];

  const handleSelectPortal = (portal: PortalConfig) => {
    setActivePortal(portal.id);
    setLoginError(null);
  };

  const handleFillDemoCredentials = (portal: PortalConfig) => {
    setActivePortal(portal.id);
    setEmail(portal.demoEmail);
    setPassword(portal.demoPass);
    setLoginError(null);
    setJustFilledDemo(portal.id);
    setTimeout(() => setJustFilledDemo(null), 2500);
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
      success("Authenticated Successfully", `Welcome to Coralgenz ${selectedPortal.shortTitle} Portal.`);
      router.push("/dashboard");
    } else {
      const errMsg = res.error || "Invalid credentials or unauthorized portal access.";
      setLoginError(errMsg);
      toastError("Authentication Failed", errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 flex flex-col justify-between font-sans text-slate-800 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900">
      
      {/* Dynamic Animated Ambient Background Blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:30px_30px] opacity-40 pointer-events-none" />
      <div className="absolute -top-36 -left-36 w-[32rem] h-[32rem] bg-sky-200/50 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow-reverse" />
      <div className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] bg-amber-100/50 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Modern Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-md shadow-sky-500/10 border border-slate-200/80 group-hover:scale-105 transition-all flex items-center justify-center">
            <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-sky-600 transition-colors">
                Coralgenz
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-wide">
                Payroll
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Suite v2.4</p>
          </div>
        </Link>

        {/* Live Cloud Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            Cloud Systems Operational
          </span>
        </div>
      </header>

      {/* Main Content Area: Split Two-Column Showcase */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SHOWCASE COLUMN (Desktop / Tablet) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-sky-200/90 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-semibold text-slate-700">
                Next-Gen Indian Statutory & Workforce Engine
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Smart Payroll. <br />
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Zero Complexity.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
                Automated EPF, ESI, Professional Tax, and TDS calculations with one-click sealed payslips, biometric attendance, and strict role-based access.
              </p>
            </div>

            {/* Live Interactive Feature Card */}
            <div className="p-5 rounded-3xl bg-white/85 border border-slate-200/90 shadow-xl shadow-sky-500/5 backdrop-blur-xl space-y-4 hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">August 2026 Active Cycle</p>
                    <p className="text-[10px] text-slate-400">Statutory Compliant Distribution</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  100% Tax Compliant
                </span>
              </div>

              {/* Progress & Stat Distribution */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Gross Pay</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">₹60,000</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-rose-500 uppercase">Statutory PF/ESI</span>
                  <p className="text-xs sm:text-sm font-black text-rose-600 mt-0.5">₹5,000</p>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
                  <span className="text-[10px] font-semibold text-sky-700 uppercase">Net Disbursed</span>
                  <p className="text-xs sm:text-sm font-black text-sky-900 mt-0.5">₹55,000</p>
                </div>
              </div>
            </div>

            {/* Enterprise Feature Points */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <BadgeCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>EPFO & ESIC Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <BadgeCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Encrypted Payslip Vault</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <BadgeCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Audit Trail Logging</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <BadgeCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Biometric Shift Sync</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (AUTHENTICATION CARD) */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto">
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.12)] rounded-3xl overflow-hidden transition-all duration-300">
              
              {/* Portal Selector Bar */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-600" />
                    Select Dedicated Portal
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Strict RBAC Isolation
                  </span>
                </div>
                
                {/* 4 Segmented Portal Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PORTALS.map((portal) => {
                    const isActive = activePortal === portal.id;
                    return (
                      <button
                        key={portal.id}
                        type="button"
                        onClick={() => handleSelectPortal(portal)}
                        className={`p-2 sm:p-2.5 rounded-2xl text-left transition-all border relative flex flex-col justify-between ${
                          isActive
                            ? "bg-white border-sky-500 text-sky-950 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20 font-bold"
                            : "bg-white/70 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{portal.icon}</span>
                          <span className="text-xs font-bold truncate">
                            {portal.shortTitle}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-normal truncate mt-1">
                          {portal.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Selected Portal Description Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 via-indigo-50/40 to-white border border-sky-100 flex items-start gap-3.5 shadow-xs transition-all">
                  <div className="text-2xl p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0 flex items-center justify-center">
                    {selectedPortal.icon}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-sm text-slate-900">
                        {selectedPortal.title}
                      </h2>
                      <Badge variant={selectedPortal.badgeVariant} size="sm" className="text-[10px] px-2 py-0.5">
                        {selectedPortal.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedPortal.description}
                    </p>
                  </div>
                </div>

                {/* Quick 1-Click Demo Fill Bar */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      Quick 1-Click Demo Credentials
                    </span>
                    <span className="text-[10px] text-amber-700/80">Click any role to auto-fill</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PORTALS.map((portal) => {
                      const isSelected = justFilledDemo === portal.id;
                      return (
                        <button
                          key={portal.id}
                          type="button"
                          onClick={() => handleFillDemoCredentials(portal)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                            isSelected
                              ? "bg-amber-500 text-white border-amber-600 shadow-sm scale-95"
                              : "bg-white text-slate-700 border-amber-200/80 hover:bg-amber-100/50 hover:border-amber-300"
                          }`}
                        >
                          <span>{portal.icon}</span>
                          <span>{portal.shortTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error Notice */}
                {loginError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Authentication Notice</span>
                    </div>
                    <p className="text-rose-700 leading-relaxed pl-6">
                      {loginError}
                    </p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Corporate Email Address
                    </label>
                    <div className="relative rounded-2xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. karthick@coralgenz.co.in"
                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Account Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative rounded-2xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 focus:ring-offset-0 transition-all"
                      />
                      <span className="text-xs text-slate-600 font-medium">
                        Remember this secure workstation
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA Button */}
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-sky-600/25 active:scale-[0.99] transition-all min-h-[48px] text-sm flex items-center justify-center gap-2"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? "Authenticating Identity..." : `Sign In to ${selectedPortal.shortTitle} Portal`}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Light Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            256-Bit SSL Encrypted
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Google Cloud Firestore Backed
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            SOC-2 Type II Certified
          </span>
        </div>

        <p className="text-xs text-slate-400">
          © 2026 Coralgenz Technologies Pvt. Ltd. • All Rights Reserved
        </p>

        <div className="flex justify-center gap-4 text-xs text-slate-500 pt-1">
          <Link href="/onboarding" className="hover:text-sky-600 underline transition-colors">
            Organization Setup
          </Link>
          <span>•</span>
          <Link href="/verify-email" className="hover:text-sky-600 underline transition-colors">
            Verify Account
          </Link>
          <span>•</span>
          <Link href="/forgot-password" className="hover:text-sky-600 underline transition-colors">
            Forgot Password
          </Link>
        </div>
      </footer>
    </div>
  );
}
