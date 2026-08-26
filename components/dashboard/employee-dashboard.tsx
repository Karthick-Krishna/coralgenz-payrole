"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate, formatTime } from "@/lib/utils";
import {
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  Megaphone,
  CheckCircle2,
  Calendar,
  Download,
  ArrowRight,
  TrendingUp,
  Building,
  Receipt,
  CreditCard,
  FileCheck,
  FileText,
} from "lucide-react";
import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  Payslip,
  Announcement,
  Holiday,
  AttendanceRecord,
} from "@/types";

interface EmployeeDashboardProps {
  employee?: Employee;
  leaveBalance?: LeaveBalance;
  leaveRequests: LeaveRequest[];
  latestPayslip?: Payslip;
  announcements: Announcement[];
  holidays: Holiday[];
}

export function EmployeeDashboard({
  employee,
  leaveBalance,
  leaveRequests,
  latestPayslip,
  announcements,
  holidays,
}: EmployeeDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const empId = employee?.id || user?.employeeId || "CGG-EMP-0002";

  const refreshAttendance = () => {
    const today = new Date().toISOString().split("T")[0];
    const att = MockDataStore.getAttendance(today);
    const myAtt = att.find((a) => a.employeeId === empId);
    setTodayAttendance(myAtt || null);
    setIsCheckedIn(Boolean(myAtt?.checkIn && !myAtt?.checkOut));
  };

  useEffect(() => {
    refreshAttendance();
    window.addEventListener("coralgenz_store_updated", refreshAttendance);
    return () => window.removeEventListener("coralgenz_store_updated", refreshAttendance);
  }, [empId]);

  const handlePunchToggle = () => {
    if (isCheckedIn) {
      MockDataStore.recordCheckOut(empId);
    } else {
      MockDataStore.recordCheckIn(
        empId,
        employee ? `${employee.firstName} ${employee.lastName}` : user?.displayName || "Employee",
        employee?.departmentId || "dept-02",
        "office"
      );
    }
    refreshAttendance();
  };

  const remainingCasual = leaveBalance?.casual?.remaining ?? 9;
  const remainingSick = leaveBalance?.sick?.remaining ?? 9;
  const remainingAnnual = leaveBalance?.annual?.remaining ?? 11;
  const remainingEarned = leaveBalance?.earned?.remaining ?? 8;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-blue-600 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-none">
            Employee Self-Service Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {employee?.firstName || user?.displayName || "Team Member"}! 👋
          </h1>
          <p className="text-xs text-white/90">
            {employee?.designationTitle || "Associate"} • {employee?.departmentName || "Engineering"} • ID: {empId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/requests")}
            leftIcon={<Receipt className="w-4 h-4" />}
            className="bg-white text-coral-600 hover:bg-white/90 border-none shadow-sm"
          >
            Submit Request / Claim
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/leave")}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            className="text-white border-white/40 hover:bg-white/10"
          >
            Apply Leave
          </Button>
          {latestPayslip && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/payslips/${latestPayslip.id}`)}
              leftIcon={<Download className="w-4 h-4" />}
              className="text-white border-white/40 hover:bg-white/10"
            >
              Latest Payslip
            </Button>
          )}
        </div>
      </div>

      {/* Quick Employee Self-Service Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => router.push("/requests")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Expense Claim</span>
            <span className="text-[10px] text-slate-400">Bills & Travel</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Salary Advance</span>
            <span className="text-[10px] text-slate-400">Emergency Loan</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Tax Declaration</span>
            <span className="text-[10px] text-slate-400">80C / 80D / Rent</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">HR Letters</span>
            <span className="text-[10px] text-slate-400">Salary / Bonafide</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Biometric Punch Clock + Leave Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biometric Attendance Punch Card */}
        <Card className="lg:col-span-1 border-coral-200/40 dark:border-coral-900/30 shadow-md">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-coral-500" />
                <span>Today&apos;s Attendance</span>
              </CardTitle>
              <Badge variant={isCheckedIn ? "success" : "secondary"} size="sm" dot>
                {isCheckedIn ? "Active Shift" : "Not Punched"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-5">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {currentTime || "09:00:00 AM"}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Punch In</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {todayAttendance?.checkIn ? formatTime(`2026-08-26T${todayAttendance.checkIn}`) : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Punch Out</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {todayAttendance?.checkOut ? formatTime(`2026-08-26T${todayAttendance.checkOut}`) : "—"}
                </p>
              </div>
            </div>

            <Button
              variant={isCheckedIn ? "danger" : "coral"}
              size="lg"
              onClick={handlePunchToggle}
              className="w-full font-bold shadow-lg"
            >
              {isCheckedIn ? "Punch Out & Complete Shift" : "Punch In Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Leave Balances Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Leave Balances (2026)
            </h3>
            <Link
              href="/leave"
              className="text-xs font-semibold text-coral-600 hover:text-coral-700 dark:text-coral-400 flex items-center gap-1"
            >
              Apply Leave &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card hoverEffect>
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Casual</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingCasual}
                </div>
                <span className="text-[10px] text-slate-500">Days Left / 12</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Sick</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingSick}
                </div>
                <span className="text-[10px] text-slate-500">Days Left / 10</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Annual</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingAnnual}
                </div>
                <span className="text-[10px] text-slate-500">Days Left / 15</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Earned</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingEarned}
                </div>
                <span className="text-[10px] text-slate-500">Days Left / 10</span>
              </CardContent>
            </Card>
          </div>

          {/* Latest Payslip Quick Banner */}
          {latestPayslip && (
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="coral" size="sm">
                    {latestPayslip.periodName}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Disbursed on {formatDate(latestPayslip.payDate)}
                  </span>
                </div>
                <p className="text-lg font-black tracking-tight">
                  Net Salary: {formatINR(latestPayslip.netSalary)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Ref: {latestPayslip.payslipNumber} • Bank: {latestPayslip.bankName}
                </p>
              </div>

              <Button
                variant="coral"
                size="sm"
                onClick={() => router.push(`/payslips/${latestPayslip.id}`)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                View & Download Payslip
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Announcements & Holidays Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-coral-500" />
              <CardTitle>Company Announcements</CardTitle>
            </div>
            <Link
              href="/announcements"
              className="text-xs font-semibold text-coral-600 dark:text-coral-400"
            >
              View all &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ann.title}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(ann.publishedAt, "dd MMM")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <CardTitle>Upcoming Holidays</CardTitle>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-coral-600 dark:text-coral-400"
            >
              Calendar &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holidays.slice(0, 4).map((hol) => (
                <div
                  key={hol.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {hol.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{hol.dayOfWeek}</p>
                  </div>
                  <Badge variant="success" size="sm">
                    {formatDate(hol.date, "dd MMM yyyy")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
