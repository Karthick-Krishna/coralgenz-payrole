"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { AttendanceService } from "@/lib/firebase/attendance-service";
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

  const refreshAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const records = await AttendanceService.getAttendance(empId);
      const myAtt = records.find((a) => a.date === today && a.employeeId === empId) || records[0];
      if (myAtt && myAtt.date === today) {
        setTodayAttendance(myAtt);
        setIsCheckedIn(Boolean(myAtt.checkIn && !myAtt.checkOut));
      } else {
        setTodayAttendance(null);
        setIsCheckedIn(false);
      }
    } catch {}
  };

  useEffect(() => {
    refreshAttendance();
    const handleStoreUpdate = () => refreshAttendance();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, [empId]);

  const handlePunchToggle = async () => {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];
    const empName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : user?.displayName || "Employee";

    if (isCheckedIn && todayAttendance) {
      await AttendanceService.logAttendance({
        ...todayAttendance,
        checkOut: nowTime,
        status: "present",
        updatedAt: new Date().toISOString(),
      });
    } else {
      await AttendanceService.logAttendance({
        id: `att-${empId}-${today}`,
        organizationId: "org-coralgenz-01",
        employeeId: empId,
        employeeName: empName,
        departmentId: employee?.departmentId || "dept-01",
        date: today,
        checkIn: nowTime,
        status: "present",
        workMode: "office",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await refreshAttendance();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
  };

  const remainingCasual = leaveBalance?.casual?.remaining ?? 9;
  const remainingSick = leaveBalance?.sick?.remaining ?? 9;
  const remainingAnnual = leaveBalance?.annual?.remaining ?? 11;
  const remainingEarned = leaveBalance?.earned?.remaining ?? 8;

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-blue-600 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-none text-[10px]">
            Employee Self-Service (ESS)
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {employee?.firstName || user?.displayName || "Team Member"}! 👋
          </h1>
          <p className="text-xs text-white/90">
            {employee?.designationTitle || "Associate"} • {employee?.departmentName || "Engineering"} • ID: {empId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/requests")}
            leftIcon={<Receipt className="w-4 h-4" />}
            className="w-full sm:w-auto bg-white text-coral-600 hover:bg-white/90 border-none shadow-sm text-xs"
          >
            Submit Request / Claim
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/leave")}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10 text-xs"
          >
            Apply Leave
          </Button>
          {latestPayslip && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/payslips/${latestPayslip.id}`)}
              leftIcon={<Download className="w-4 h-4" />}
              className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10 text-xs"
            >
              Latest Payslip
            </Button>
          )}
        </div>
      </div>

      {/* Quick Employee Self-Service Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => router.push("/requests")}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-2.5 sm:gap-3 active:scale-95"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">Expense Claim</span>
            <span className="text-[10px] text-slate-400 truncate block">Bills & Travel</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-2.5 sm:gap-3 active:scale-95"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">Salary Advance</span>
            <span className="text-[10px] text-slate-400 truncate block">Emergency Loan</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-2.5 sm:gap-3 active:scale-95"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">Tax Declaration</span>
            <span className="text-[10px] text-slate-400 truncate block">80C / 80D</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-coral-400 dark:hover:border-coral-600 transition-all text-left shadow-sm hover:shadow-md flex items-center gap-2.5 sm:gap-3 active:scale-95"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">HR Letters</span>
            <span className="text-[10px] text-slate-400 truncate block">Certificate</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Biometric Punch Clock + Leave Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Biometric Attendance Punch Card */}
        <Card className="lg:col-span-1 border-coral-200/40 dark:border-coral-900/30 shadow-md">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5">
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
          <CardContent className="p-4 sm:p-6 text-center space-y-4 sm:space-y-5">
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-4xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {currentTime || "09:00:00 AM"}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Punch In</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {todayAttendance?.checkIn ? formatTime(`2026-08-26T${todayAttendance.checkIn}`) : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Punch Out</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {todayAttendance?.checkOut ? formatTime(`2026-08-26T${todayAttendance.checkOut}`) : "—"}
                </p>
              </div>
            </div>

            <Button
              variant={isCheckedIn ? "danger" : "coral"}
              size="lg"
              onClick={handlePunchToggle}
              className="w-full font-bold shadow-lg min-h-[44px]"
            >
              {isCheckedIn ? "Punch Out & Complete Shift" : "Punch In Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Leave Balances Grid */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Leave Balances (2026)
            </h3>
            <Link
              href="/leave"
              className="text-xs font-semibold text-coral-600 hover:text-coral-700 dark:text-coral-400 flex items-center gap-1"
            >
              Apply Leave &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <Card hoverEffect>
              <CardContent className="p-3 sm:p-4 text-center space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Casual</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingCasual}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Days Left / 12</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-3 sm:p-4 text-center space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Sick</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingSick}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Days Left / 10</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-3 sm:p-4 text-center space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Annual</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingAnnual}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Days Left / 15</span>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-3 sm:p-4 text-center space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Earned</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {remainingEarned}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Days Left / 10</span>
              </CardContent>
            </Card>
          </div>

          {/* Quick Info Split: Latest Payslip Snapshot & Leave Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Latest Payslip Mini Card */}
            <Card>
              <CardHeader className="p-3.5 sm:p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-coral-500" />
                  <span>Latest Payslip</span>
                </CardTitle>
                {latestPayslip && (
                  <Badge variant="success" size="sm">
                    {latestPayslip.status.toUpperCase()}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-3.5 sm:p-4 pt-1 space-y-3">
                {latestPayslip ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{latestPayslip.periodName}</p>
                        <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          {formatINR(latestPayslip.netSalary)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/payslips/${latestPayslip.id}`)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        View & PDF
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400">Gross:</span>{" "}
                        <span className="font-semibold font-mono">{formatINR(latestPayslip.grossSalary)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Deductions:</span>{" "}
                        <span className="font-semibold font-mono text-rose-500">
                          {formatINR(latestPayslip.totalDeductions)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No payslip generated yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Holidays */}
            <Card>
              <CardHeader className="p-3.5 sm:p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Upcoming Holidays</span>
                </CardTitle>
                <Link
                  href="/calendar"
                  className="text-[11px] font-semibold text-coral-600 dark:text-coral-400"
                >
                  View All &rarr;
                </Link>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-4 pt-1 space-y-2">
                {holidays.slice(0, 2).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {h.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDate(h.date)}</p>
                    </div>
                    <Badge variant="secondary" size="sm" className="text-[10px]">
                      {h.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
