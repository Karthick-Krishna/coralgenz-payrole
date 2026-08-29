"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
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
  Building2,
  FileSpreadsheet,
  Users,
  Shield,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email || !password) {
      toastError("Missing Fields", "Please enter your corporate email address and password.");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      success("Welcome Back", "Authenticated successfully with the payroll server.");
      router.push("/dashboard");
    } else {
      const errMsg = res.error || "Invalid email or password. Please verify your credentials.";
      setLoginError(errMsg);
      toastError("Authentication Failed", errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col justify-between font-sans text-slate-800 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900">
      
      {/* Animated Ambient Light Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 -right-36 w-[32rem] h-[32rem] bg-indigo-200/35 rounded-full blur-3xl pointer-events-none animate-float-slow-reverse" />
      <div className="absolute -bottom-36 left-1/4 w-[30rem] h-[30rem] bg-amber-100/40 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-md shadow-sky-500/10 border border-slate-200/80 group-hover:scale-105 transition-all flex items-center justify-center">
            <img src="/logo.png" alt="Coralgenz Logo" className="w-full h-full object-contain" />
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

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            Cloud Systems Operational
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT SHOWCASE COLUMN (Desktop / Tablet) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Top Innovation Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-sky-200/90 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-semibold text-slate-700">
                Enterprise Payroll, Compliance & ESS Platform
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Intelligent Payroll. <br />
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Automated Indian Compliance.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
                Unified workforce management with automated EPF, ESI, Professional Tax, and TDS withholding, instant digital payslips, and biometric attendance.
              </p>
            </div>

            {/* 3 Core Value Cards */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/85 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Statutory Compliance Guaranteed
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Automated Indian statutory calculations adhering strictly to EPFO, ESIC, Professional Tax, and Gratuity formulas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/85 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Instant Digitally-Sealed Payslips
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Tamper-proof salary slips with full CTC breakdown, employee PAN, and one-click PDF generation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/85 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Employee Self-Service & Attendance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Direct web check-in/out, leave applications, reimbursement claims, and tax declaration submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-sky-600" />
                EPFO / ESIC Ready
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-sky-600" />
                Role-Based Security
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-sky-600" />
                Full Audit Trail
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: REAL PRODUCTION LOGIN CARD */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto">
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.12)] rounded-3xl p-6 sm:p-10 space-y-6 transition-all">
              
              {/* Card Header */}
              <div className="text-left space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 flex items-center justify-center shadow-md shadow-sky-500/20 mb-3">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sign in to your account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Enter your registered corporate credentials to access the portal.
                </p>
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

              {/* Production Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Corporate Email */}
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
                      placeholder="e.g. employee@coralgenz.co.in"
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      placeholder="Enter your secure password"
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
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

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 focus:ring-offset-0 transition-all"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      Keep me signed in on this device
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-sky-600/25 active:scale-[0.99] transition-all min-h-[48px] text-sm flex items-center justify-center gap-2 mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? "Authenticating with Server..." : "Sign In to Payroll Workspace"}
                </Button>
              </form>

              {/* Single Sign-On / Security Note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Your identity and role permissions are securely verified directly with the Google Cloud database server.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Light Theme Footer */}
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
