"use client";

import React, { useState } from "react";
import { Employee, PayrollRun, AttendanceRecord, LeaveRequest, Department } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatINR, formatDate } from "@/lib/utils";
import { exportToCSV, exportToExcel, printElement } from "@/lib/export/export-utils";
import {
  BarChart3,
  Download,
  Printer,
  Users,
  CreditCard,
  CalendarCheck,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface ReportViewerProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  departments: Department[];
}

export function ReportViewer({
  employees,
  payrollRuns,
  attendance,
  leaveRequests,
  departments,
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState("payroll_summary");

  const latestRun = payrollRuns[0] || {
    totalGrossPayroll: 844000,
    totalNetPayroll: 762450,
    totalPfContribution: 64800,
    totalEsiContribution: 4200,
    totalTdsDeduction: 12550,
  };

  const tabs = [
    { id: "payroll_summary", label: "Payroll & Tax Analytics", icon: <CreditCard className="w-4 h-4" /> },
    { id: "headcount", label: "Headcount & Department Cost", icon: <Users className="w-4 h-4" /> },
    { id: "attendance_report", label: "Attendance & Punctuality", icon: <Clock className="w-4 h-4" /> },
    { id: "leave_report", label: "Leave Utilization", icon: <CalendarCheck className="w-4 h-4" /> },
  ];

  const handleExportCSV = () => {
    if (activeTab === "payroll_summary") {
      const data = employees.map((e) => ({
        "Employee Name": `${e.firstName} ${e.lastName}`,
        "Employee ID": e.id,
        Department: e.departmentName,
        "Monthly Gross (INR)": e.currentMonthlyGross,
        "Annual CTC (INR)": e.currentAnnualCtc,
      }));
      exportToCSV(data, "Coralgenz_Payroll_Compliance_Report");
    } else {
      const data = departments.map((d) => ({
        Department: d.name,
        Code: d.code,
        "Employee Count": d.employeeCount,
        "Monthly Payroll Budget (INR)": d.monthlyPayrollCost,
      }));
      exportToCSV(data, "Coralgenz_Department_Analytics");
    }
  };

  const handleExportExcel = () => {
    const data = employees.map((e) => ({
      "Employee Name": `${e.firstName} ${e.lastName}`,
      "Employee ID": e.id,
      Department: e.departmentName,
      "Monthly Gross (INR)": e.currentMonthlyGross,
      "Annual CTC (INR)": e.currentAnnualCtc,
    }));
    exportToExcel(data, "Coralgenz_Executive_Report", "PayrollSummary");
  };

  const COLORS = ["#ff5722", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"];

  const deptCostData = departments.map((d) => ({
    name: d.name,
    cost: d.monthlyPayrollCost,
    count: d.employeeCount,
  }));

  const statutoryBreakdown = [
    { name: "Net Disbursed", value: latestRun.totalNetPayroll, fill: "#10b981" },
    { name: "Provident Fund (12%)", value: latestRun.totalPfContribution, fill: "#3b82f6" },
    { name: "Income Tax (TDS)", value: latestRun.totalTdsDeduction, fill: "#ff5722" },
    { name: "ESI (0.75%)", value: latestRun.totalEsiContribution, fill: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Reports & Executive Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated statutory tax compliance, department budget distributions, and headcount trends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export Excel
          </Button>
          <Button
            variant="coral"
            size="sm"
            onClick={() => printElement("printable-report")}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div id="printable-report" className="space-y-6">
        {/* TAB 1: PAYROLL & STATUTORY SUMMARY */}
        {activeTab === "payroll_summary" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card hoverEffect>
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Gross CTC</span>
                  <div className="text-xl font-black mt-0.5">{formatINR(latestRun.totalGrossPayroll)}</div>
                  <p className="text-[10px] text-slate-400">Monthly Run Base</p>
                </CardContent>
              </Card>

              <Card hoverEffect>
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Total PF (EPF + EPS)</span>
                  <div className="text-xl font-black text-blue-600 mt-0.5">{formatINR(latestRun.totalPfContribution)}</div>
                  <p className="text-[10px] text-slate-400">Statutory 12% Match</p>
                </CardContent>
              </Card>

              <Card hoverEffect>
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-rose-600">TDS / Income Tax</span>
                  <div className="text-xl font-black text-rose-600 mt-0.5">{formatINR(latestRun.totalTdsDeduction)}</div>
                  <p className="text-[10px] text-slate-400">Tax Withheld</p>
                </CardContent>
              </Card>

              <Card hoverEffect>
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Net Disbursed</span>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">{formatINR(latestRun.totalNetPayroll)}</div>
                  <p className="text-[10px] text-slate-400">Bank NEFT Batch</p>
                </CardContent>
              </Card>
            </div>

            {/* Statutory Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Statutory Payroll Composition Breakdown</CardTitle>
                <p className="text-xs text-slate-500">Distribution of gross salary into take-home pay and tax reserves</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statutoryBreakdown} layout="vertical">
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={140} />
                      <Tooltip formatter={(val: number) => [formatINR(val), "Amount"]} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {statutoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: HEADCOUNT & DEPARTMENT COSTS */}
        {activeTab === "headcount" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Monthly Payroll Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptCostData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip formatter={(val: number) => [formatINR(val), "Cost"]} />
                        <Bar dataKey="cost" fill="#ff5722" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Headcount by Department</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {departments.map((dept, i) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{dept.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold">{dept.employeeCount} Members ({Math.round((dept.employeeCount / (employees.length || 1)) * 100)}%)</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === "attendance_report" && (
          <Card className="animate-in fade-in duration-150">
            <CardHeader>
              <CardTitle>Monthly Attendance & Punctuality Summary</CardTitle>
              <p className="text-xs text-slate-500">Average working hours and overtime records</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Average Work Hours</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">8.5 hrs/day</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600">On-Time Arrival Rate</span>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">96.4%</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600">Total Overtime Logged</span>
                  <div className="text-2xl font-black text-amber-600 mt-0.5">42 hrs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: LEAVE */}
        {activeTab === "leave_report" && (
          <Card className="animate-in fade-in duration-150">
            <CardHeader>
              <CardTitle>Leave Utilization Analysis (2026)</CardTitle>
              <p className="text-xs text-slate-500">Breakdown of casual, sick, and earned leaves taken across departments</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Casual Leave Used</span>
                  <div className="text-xl font-bold mt-0.5">18 Days</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sick Leave Used</span>
                  <div className="text-xl font-bold mt-0.5">7 Days</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Annual Leave Used</span>
                  <div className="text-xl font-bold mt-0.5">24 Days</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Approval Rate</span>
                  <div className="text-xl font-bold text-emerald-600 mt-0.5">94%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
