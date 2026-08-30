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
  AlertCircle,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col justify-center items-center font-sans text-slate-800 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900 p-4 sm:p-6">
      
      {/* Animated Ambient Light Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 -right-36 w-[32rem] h-[32rem] bg-indigo-200/35 rounded-full blur-3xl pointer-events-none animate-float-slow-reverse" />
      <div className="absolute -bottom-36 left-1/4 w-[30rem] h-[30rem] bg-amber-100/40 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Main Authentication Container */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group mx-auto mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-lg shadow-sky-500/10 border border-slate-200/80 group-hover:scale-105 transition-all flex items-center justify-center">
              <img src="/logo.png" alt="Coralgenz Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-sky-600 transition-colors">
                  Coralgenz
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-wide">
                  Payroll
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Management Suite</p>
            </div>
          </Link>
        </div>

        {/* Primary Authentication Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.14)] rounded-3xl p-6 sm:p-9 space-y-6 transition-all">
          
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-xs mx-auto">
              Enter your registered corporate credentials to access the portal.
            </p>
          </div>

          {/* Error Notice */}
          {loginError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in duration-200 shadow-sm text-left">
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
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* Corporate Email Address */}
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

            {/* Account Password */}
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

            {/* Keep me signed in */}
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

            {/* Submit Action Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-sky-600/25 active:scale-[0.99] transition-all min-h-[48px] text-sm flex items-center justify-center gap-2 mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Authenticating with Server..." : "Sign In to Payroll Workspace"}
            </Button>
          </form>

          {/* Server Verification Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Your identity and role permissions are securely verified directly with the Google Cloud database server.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
