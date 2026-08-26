"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessModule } from "@/lib/permissions/rbac";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Building2,
  Briefcase,
  Calendar,
  Megaphone,
  BarChart3,
  ShieldAlert,
  Settings,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { label: "Employees", href: "/employees", icon: Users, module: "employees" },
  { label: "Attendance", href: "/attendance", icon: Clock, module: "attendance" },
  { label: "Leave", href: "/leave", icon: CalendarCheck, module: "leave" },
  { label: "Payroll", href: "/payroll", icon: CreditCard, module: "payroll" },
  { label: "Payslips", href: "/payslips", icon: FileSpreadsheet, module: "payslips" },
  { label: "Departments", href: "/departments", icon: Building2, module: "departments" },
  { label: "Designations", href: "/designations", icon: Briefcase, module: "designations" },
  { label: "Calendar", href: "/calendar", icon: Calendar, module: "calendar" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, module: "announcements" },
  { label: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { label: "Audit Logs", href: "/audit-logs", icon: ShieldAlert, module: "audit_logs" },
  { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { user, currentRole, switchRole, isDemoMode } = useAuth();

  const allowedNavItems = NAV_ITEMS.filter((item) =>
    canAccessModule(currentRole, item.module)
  );

  const roleLabels: Record<UserRole, { label: string; variant: "coral" | "purple" | "info" | "warning" | "success" }> = {
    super_admin: { label: "Super Admin", variant: "coral" },
    hr_admin: { label: "HR Admin", variant: "info" },
    payroll_manager: { label: "Payroll Mgr", variant: "purple" },
    manager: { label: "Manager", variant: "warning" },
    employee: { label: "Employee", variant: "success" },
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-coral-600 to-coral-400 flex items-center justify-center text-white font-black text-xl shadow-glow">
          C
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white tracking-tight truncate">
              Coralgenz
            </span>
            <span className="text-coral-500 font-black text-xs uppercase tracking-wider">
              Pay
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            Workforce & Payroll
          </p>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Role
          </span>
          <Badge variant={roleLabels[currentRole]?.variant || "coral"} size="sm" dot>
            {roleLabels[currentRole]?.label || "User"}
          </Badge>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                isActive
                  ? "bg-coral-500 text-white shadow-sm shadow-coral-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-coral-400"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
              ) : item.badge ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-coral-950 text-coral-300">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Demo Switcher Quick Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 px-1">
          <Sparkles className="w-3.5 h-3.5 text-coral-400" />
          <span>Switch Perspective</span>
        </div>
        <select
          value={currentRole}
          onChange={handleRoleChange}
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-coral-500 cursor-pointer"
        >
          <option value="super_admin">👑 Super Admin (Karthick)</option>
          <option value="hr_admin">💼 HR Admin (Karthick)</option>
          <option value="payroll_manager">📊 Payroll Mgr (Thanvanth H)</option>
          <option value="manager">👔 Manager (Sarvesh)</option>
          <option value="employee">👩‍💻 Employee</option>
        </select>
        {isDemoMode && (
          <div className="text-[10px] text-center text-slate-400 font-mono">
            Demo Mode Active
          </div>
        )}
      </div>
    </aside>
  );
}
