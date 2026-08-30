"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  KeyRound,
  ShieldAlert,
  UserCheck,
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

  // Contact SuperAdmin modal state
  const [showContactAdminModal, setShowContactAdminModal] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 flex flex-col justify-between font-sans text-slate-800 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900">
      
      {/* Animated Ambient Light Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-sky-200/50 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 -right-36 w-[34rem] h-[34rem] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow-reverse" />
      <div className="absolute -bottom-36 left-1/4 w-[32rem] h-[32rem] bg-amber-100/50 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-2 shadow-md shadow-sky-500/10 border border-slate-200/80 group-hover:scale-105 transition-all flex items-center justify-center">
            <img src="/logo.png" alt="Coralgenz Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-lg sm:text-xl tracking-tight group-hover:text-sky-600 transition-colors">
                Coralgenz
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-wide">
                Payroll
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Suite v2.4</p>
          </div>
        </Link>

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Cloud Systems Operational
          </span>
        </div>
      </header>

      {/* Main Content Area - Large Desktop Layout */}
      <main className="relative z-10 w-full max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 my-auto">
        
        {/* Animated Brand Heading Design */}
        <div className="text-center space-y-3.5 mb-8">
          {/* Animated Glowing Logo Badge */}
          <div className="relative inline-flex items-center justify-center mb-1">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-orange-500 via-coral-500 to-indigo-600 blur-xl opacity-75 animate-fire-glow-pulse pointer-events-none" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/95 p-3.5 shadow-2xl border border-amber-200/80 flex items-center justify-center backdrop-blur-sm group hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Coralgenz Payroll" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          {/* Grand Animated Gradient Heading */}
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight flex items-center justify-center gap-3 flex-wrap">
              <span className="bg-gradient-to-r from-slate-950 via-slate-800 to-sky-950 bg-clip-text text-transparent drop-shadow-xs">
                Coralgenz
              </span>
              <span className="bg-gradient-to-r from-coral-500 via-amber-500 to-rose-600 bg-clip-text text-transparent animate-gradient-flow font-extrabold drop-shadow-[0_4px_15px_rgba(255,107,74,0.35)]">
                Payroll
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-500 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Enterprise Workforce & Compensation Platform</span>
            </p>
          </div>
        </div>

        {/* Central Authentication Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_30px_70px_-15px_rgba(2,132,199,0.18)] rounded-3xl p-7 sm:p-10 lg:p-12 space-y-7 transition-all">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-normal max-w-sm mx-auto">
              Enter your registered corporate credentials to access the portal.
            </p>
          </div>

          {/* Error Notice */}
          {loginError && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-200 shadow-sm text-left">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Authentication Notice</span>
              </div>
              <p className="text-rose-700 leading-relaxed pl-6">
                {loginError}
              </p>
            </div>
          )}

          {/* Production Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Corporate Email Address */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Corporate Email Address
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@coralgenz.co.in"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Account Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowContactAdminModal(true)}
                  className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white pl-12 pr-12 py-3.5 sm:py-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded-md text-sky-600 border-slate-300 focus:ring-sky-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  Keep me signed in on this device
                </span>
              </label>
            </div>

            {/* Submit Action Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold py-4 sm:py-4.5 rounded-2xl shadow-xl shadow-sky-600/25 active:scale-[0.99] transition-all min-h-[54px] text-base sm:text-lg flex items-center justify-center gap-2 mt-3"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {isLoading ? "Authenticating with Server..." : "Sign In to Payroll Workspace"}
            </Button>
          </form>

          {/* Server Verification Note */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 flex items-center gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <span className="leading-relaxed">
              Your identity and role permissions are securely verified directly with the Google Cloud database server.
            </span>
          </div>
        </div>
      </main>

      {/* Contact SuperAdmin Password Reset Modal */}
      <Modal
        isOpen={showContactAdminModal}
        onClose={() => setShowContactAdminModal(false)}
        title="Contact Super Admin for Password Reset"
        description="Password resets are strictly managed by Organization Administrators for corporate security compliance."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">Corporate Security & Identity Governance Policy</p>
              <p className="leading-relaxed">
                Self-service password resets are disabled for corporate accounts. Please contact your <strong>Super Admin</strong> or <strong>HR Administrator</strong> to update or reset your portal credentials.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Administrator Desk:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600" />
                Super Admin / HR Support
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Corporate Email:</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">karthick@coralgenz.co.in</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Turnaround Time:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Instant Admin Reset</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="coral"
              size="md"
              onClick={() => setShowContactAdminModal(false)}
              className="w-full sm:w-auto font-bold"
            >
              Understood, Back to Sign In
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clean Bottom Spacing */}
      <div className="py-6" />
    </div>
  );
}
