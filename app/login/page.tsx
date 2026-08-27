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
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  Sparkles,
  CreditCard,
  UserCheck,
  Shield,
  KeyRound,
} from "lucide-react";

interface PortalConfig {
  id: UserRole;
  title: string;
  name: string;
  email: string;
  icon: string;
  badge: string;
  badgeVariant: "coral" | "purple" | "info" | "warning" | "success";
  description: string;
}

const PORTALS: PortalConfig[] = [
  {
    id: "super_admin",
    title: "Super Admin Portal",
    name: "Karthick Krishna",
    email: "karthick@coralgenz.co.in",
    icon: "👑",
    badge: "Master Control",
    badgeVariant: "coral",
    description: "Full master administrative access with role delegation and complete configuration.",
  },
  {
    id: "hr_admin",
    title: "HR Admin Portal",
    name: "Karthick Krishna",
    email: "hr@coralgenz.co.in",
    icon: "💼",
    badge: "HR Operations",
    badgeVariant: "info",
    description: "Workforce directory, attendance records, leave approvals, and recruitment.",
  },
  {
    id: "payroll_manager",
    title: "Payroll Manager Portal",
    name: "Thanvanth H",
    email: "payroll@coralgenz.co.in",
    icon: "📊",
    badge: "Finance & Payroll",
    badgeVariant: "purple",
    description: "Salary processing, statutory compliance (PF/ESI/PT/TDS), and payslip generation.",
  },
  {
    id: "manager",
    title: "Team Manager Portal",
    name: "Sarvesh",
    email: "manager@coralgenz.co.in",
    icon: "👔",
    badge: "Team Management",
    badgeVariant: "warning",
    description: "Department team attendance, shift tracking, and team leave approvals.",
  },
  {
    id: "employee",
    title: "Employee Portal (ESS)",
    name: "Workforce Self-Service",
    email: "employee@coralgenz.co.in",
    icon: "👩‍💻",
    badge: "Employee Self-Service",
    badgeVariant: "success",
    description: "View payslips, check in/out, submit leave, and apply for expense claims/advances.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [activePortal, setActivePortal] = useState<UserRole>("super_admin");
  const [email, setEmail] = useState("karthick@coralgenz.co.in");
  const [password, setPassword] = useState("Coralgenz@2026");
  const [isLoading, setIsLoading] = useState(false);
  const selectedPortal = PORTALS.find((p) => p.id === activePortal) || PORTALS[0];

  const DEMO_EMAILS = [
    "karthick@coralgenz.co.in",
    "hr@coralgenz.co.in",
    "payroll@coralgenz.co.in",
    "manager@coralgenz.co.in",
    "employee@coralgenz.co.in",
  ];

  const handleSelectPortal = (portal: PortalConfig) => {
    setActivePortal(portal.id);
    if (!email || DEMO_EMAILS.includes(email.toLowerCase().trim())) {
      setEmail(portal.email);
      setPassword("Coralgenz@2026");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError("Missing Fields", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password, activePortal);
    setIsLoading(false);

    if (res.success) {
      success("Authenticated Successfully", `Welcome to ${selectedPortal.title}.`);
      router.push("/dashboard");
    } else {
      toastError("Authentication Failed", res.error || "Invalid credentials or unauthorized portal access.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      {/* Background light-blue gradient aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto shadow-2xl shadow-sky-500/20 overflow-hidden border border-sky-200">
          <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
          Coralgenz Payrole
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Enterprise Payroll & Role-Based Access Control Platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-5 sm:mt-7 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 space-y-4 sm:space-y-6">
        <Card className="border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden rounded-2xl sm:rounded-3xl">
          {/* Top Portal Selection Ribbon - Swipeable on mobile */}
          <div className="p-2.5 sm:p-3 bg-slate-950 border-b border-slate-800">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Select Dedicated Login Portal:
            </p>
            <div className="flex sm:grid sm:grid-cols-5 gap-1.5 overflow-x-auto no-scrollbar touch-scroll pb-1 sm:pb-0">
              {PORTALS.map((portal) => {
                const isActive = activePortal === portal.id;
                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => handleSelectPortal(portal)}
                    className={`py-2 px-2.5 sm:px-2 rounded-xl text-left transition-all border shrink-0 sm:shrink min-w-[130px] sm:min-w-0 ${
                      isActive
                        ? "bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-400 shadow-md"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                      <span>{portal.icon}</span>
                      <span className="truncate">{portal.title.replace(" Portal", "")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{portal.name.split(" ")[0]}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {/* Active Portal Banner */}
            <div className="p-3 sm:p-4 rounded-2xl bg-sky-950/40 border border-sky-800/40 flex items-start gap-3">
              <div className="text-xl sm:text-2xl p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                {selectedPortal.icon}
              </div>
              <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">
                    {selectedPortal.title}
                  </h3>
                  <Badge variant={selectedPortal.badgeVariant} size="sm" className="text-[9px]">
                    {selectedPortal.badge}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {selectedPortal.description}
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              <Input
                label="Registered Corporate Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@coralgenz.co.in"
                leftIcon={<Mail className="w-4 h-4 text-sky-400" />}
                className="bg-slate-950/70 border-slate-700 text-white focus:border-sky-500 text-xs sm:text-sm"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-sky-400" />}
                  className="bg-slate-950/70 border-slate-700 text-white focus:border-sky-500 text-xs sm:text-sm"
                />
              </div>

              {/* Portal Access Notice */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-[10px] sm:text-[11px]">
                  {activePortal === "super_admin"
                    ? "Super Admin login can switch between any portal views in-session."
                    : "Admin & Employee access is strictly granted and controlled by the Super Admin."}
                </span>
              </div>

              <Button
                type="submit"
                variant="coral"
                isLoading={isLoading}
                className="w-full font-bold shadow-lg shadow-sky-500/20 py-2.5 min-h-[44px]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to {selectedPortal.title}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Corporate Security Footer */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>Coralgenz Technologies Pvt. Ltd. • Firebase Secure Cloud Backend</p>
          <div className="flex justify-center gap-4 pt-0.5 text-[11px]">
            <Link href="/onboarding" className="text-slate-400 hover:text-sky-400 underline">
              Organization Setup
            </Link>
            <span>•</span>
            <Link href="/verify-email" className="text-slate-400 hover:text-sky-400 underline">
              Verify Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
