"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export function BottomNav({ onOpenMobileMenu }: BottomNavProps) {
  const pathname = usePathname();
  const { currentRole } = useAuth();

  const isEmployee = currentRole === "employee";

  const navItems = isEmployee
    ? [
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Punch", href: "/attendance", icon: Clock },
        { label: "Leave", href: "/leave", icon: CalendarCheck },
        { label: "Payslips", href: "/payslips", icon: FileSpreadsheet },
      ]
    : [
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Staff", href: "/employees", icon: Users },
        { label: "Attendance", href: "/attendance", icon: Clock },
        {
          label: currentRole === "payroll_manager" ? "Payroll" : "Requests",
          href: currentRole === "payroll_manager" ? "/payroll" : "/requests",
          icon: currentRole === "payroll_manager" ? CreditCard : Receipt,
        },
      ];

  return (
    <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe transition-all">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full py-1 transition-all group relative active:scale-95",
                isActive
                  ? "text-coral-600 dark:text-coral-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              )}
            >
              {isActive && (
                <span className="absolute top-1 w-8 h-1 bg-coral-500 rounded-full animate-in fade-in zoom-in duration-200" />
              )}
              <div
                className={cn(
                  "p-1 rounded-xl transition-colors",
                  isActive && "bg-coral-50 dark:bg-coral-950/50"
                )}
              >
                <Icon className="w-5 h-5 transition-transform" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / Full Drawer Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center h-full py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all active:scale-95 group"
        >
          <div className="p-1 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
}
