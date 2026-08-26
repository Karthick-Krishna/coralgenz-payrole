"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Clock,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  PlayCircle,
  FileCheck,
  Download,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Employee,
  PayrollRun,
  AttendanceRecord,
  LeaveRequest,
  AuditLog,
  Department,
} from "@/types";

interface SuperAdminDashboardProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  auditLogs: AuditLog[];
  departments: Department[];
}

export function SuperAdminDashboard({
  employees,
  payrollRuns,
  attendance,
  leaveRequests,
  auditLogs,
  departments,
}: SuperAdminDashboardProps) {
  const router = useRouter();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const presentToday = attendance.filter((a) => a.status === "present").length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending").length;

  const latestRun = payrollRuns[0] || {
    periodName: "August 2026",
    totalGrossPayroll: 844000,
    totalNetPayroll: 762450,
    status: "draft",
  };

  // Mock historical payroll data for chart
  const payrollTrendData = [
    { month: "Mar", gross: 780000, net: 710000 },
    { month: "Apr", gross: 810000, net: 735000 },
    { month: "May", gross: 820000, net: 742000 },
    { month: "Jun", gross: 835000, net: 755000 },
    { month: "Jul", gross: 844000, net: 762450 },
    { month: "Aug (Est)", gross: 855000, net: 772000 },
  ];

  const deptData = departments.map((d) => ({
    name: d.name,
    employees: d.employeeCount,
    payroll: d.monthlyPayrollCost,
  }));

  const COLORS = ["#0284c7", "#0ea5e9", "#38bdf8", "#06b6d4", "#3b82f6", "#10b981"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-sky-950/80 to-slate-900 text-white shadow-xl relative overflow-hidden border border-sky-800/30">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="coral" size="sm">
              Super Admin Workspace
            </Badge>
            <span className="text-xs text-slate-400 font-medium">
              Bengaluru HQ • Active Financial Year 2026-27
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Coralgenz Workforce & Payroll
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Complete corporate payroll processing, compliance records (PF/ESI/PT/TDS), employee lifecycles, and automated payslip distribution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/payroll/process")}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Process August Payroll
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/employees/new")}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Add Employee
          </Button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Employees */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Employees
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {totalEmployees}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 100% active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Across 6 departments</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Present Today
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {presentToday} / {activeEmployees}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {Math.round((presentToday / (activeEmployees || 1)) * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">1 on approved leave, 1 remote</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Current Monthly Payroll */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Monthly Net Payroll
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatINR(latestRun.totalNetPayroll)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Gross: {formatINR(latestRun.totalGrossPayroll)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-coral-50 dark:bg-coral-950/60 text-coral-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Leave Queue
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {pendingLeaves}
                </span>
                <span className="text-xs font-semibold text-amber-600">Requires Review</span>
              </div>
              <p className="text-[11px] text-slate-400">Diya Raj & Sneha Reddy</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Expense Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Monthly Payroll Cost Trend</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gross Salary vs. Net Disbursed (INR)
              </p>
            </div>
            <Badge variant="coral" size="sm">
              FY 2026-27
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollTrendData}>
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5722" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatINR(val), ""]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gross"
                    name="Gross Salary"
                    stroke="#ff5722"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGross)"
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    name="Net Disbursed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Department Payroll Cost</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly budget per department
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="payroll"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatINR(val), "Monthly Cost"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {deptData.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                      {d.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {formatINR(d.payroll)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Core Management Actions</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Frequently accessed workflows
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button
              variant="outline"
              className="w-full justify-between text-xs py-3"
              onClick={() => router.push("/payroll/process")}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-coral-500" />
                <span>Execute Payroll Run</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between text-xs py-3"
              onClick={() => router.push("/employees/new")}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Onboard New Employee</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between text-xs py-3"
              onClick={() => router.push("/leave")}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
                <span>Review Leave Requests</span>
              </div>
              <Badge variant="warning" size="sm">
                {pendingLeaves}
              </Badge>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between text-xs py-3"
              onClick={() => router.push("/reports")}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>Generate Compliance Reports</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Button>
          </CardContent>
        </Card>

        {/* Live Immutable Audit Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Activity & Audit Log</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable security and transaction log
              </p>
            </div>
            <Link
              href="/audit-logs"
              className="text-xs font-semibold text-coral-600 hover:text-coral-700 dark:text-coral-400"
            >
              View all &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {log.userName}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {log.action.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDate(log.timestamp, "dd MMM, hh:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
