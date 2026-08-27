"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import {
  CreditCard,
  PlayCircle,
  Lock,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { PayrollRun, PayrollItem, Employee } from "@/types";

interface PayrollDashboardProps {
  payrollRuns: PayrollRun[];
  employees: Employee[];
}

export function PayrollDashboard({
  payrollRuns,
  employees,
}: PayrollDashboardProps) {
  const router = useRouter();

  const activeEmployees = employees.filter((e) => e.status === "active" || e.status === "probation");
  const latestRun = payrollRuns[0];

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-950 via-blue-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-800/40">
        <div className="space-y-1">
          <Badge variant="purple" size="sm" className="bg-white/20 text-white border-none">
            Payroll & Statutory Suite
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Payroll Management
          </h1>
          <p className="text-xs text-white/80">
            Earnings, statutory deductions (PF, ESI, PT, TDS), review calculations, and generate payslips.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/payroll/process")}
            leftIcon={<PlayCircle className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Process Current Payroll
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/payroll/structures")}
            className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10 text-xs"
          >
            Salary Structures
          </Button>
        </div>
      </div>

      {/* KPI Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="coral" size="sm">
                August Ready
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{activeEmployees.length} Staff Eligible</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Payroll</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
              {formatINR(844000)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Basic + Allowances</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory (PF/Tax)</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
              {formatINR(81550)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">PF + ESI + PT + TDS</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursable Net</p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatINR(762450)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Bank Transfer</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Processing Workflow Stepper Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">Payroll Cycle Workflow (August 2026)</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              6-step compliance & disbursement workflow
            </p>
          </div>
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/payroll/process")}
            leftIcon={<PlayCircle className="w-4 h-4" />}
            className="text-xs"
          >
            Start Processing Wizard
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {[
              { step: 1, label: "Month Select", desc: "August 2026", status: "completed" },
              { step: 2, label: "Fetch Attendance", desc: "10 Staff", status: "completed" },
              { step: 3, label: "Calculate PF/Tax", desc: "Statutory rules", status: "completed" },
              { step: 4, label: "Preview Table", desc: "Review items", status: "current" },
              { step: 5, label: "Lock & Protect", desc: "Immutable freeze", status: "upcoming" },
              { step: 6, label: "Batch Payslips", desc: "PDF & Publish", status: "upcoming" },
            ].map((s) => (
              <div
                key={s.step}
                className="p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-coral-500 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center">
                    {s.step}
                  </span>
                  <Badge
                    variant={
                      s.status === "completed"
                        ? "success"
                        : s.status === "current"
                        ? "coral"
                        : "secondary"
                    }
                    size="sm"
                    className="text-[9px] px-1.5"
                  >
                    {s.status}
                  </Badge>
                </div>
                <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{s.label}</h5>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Payroll Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Payroll History</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit-verified historical payroll disbursements
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/payslips")}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            className="text-xs"
          >
            All Payslips
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {run.periodName}
                    </span>
                    <Badge variant={run.status === "locked" || run.status === "paid" ? "success" : "coral"} size="sm">
                      {run.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Gross: {formatINR(run.totalGrossPayroll)} • Deductions: {formatINR(run.totalDeductions)} • Net:{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(run.totalNetPayroll)}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Approved by {run.approvedByName || "Admin"} on {formatDate(run.approvedAt || run.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/payslips")}
                    leftIcon={<Download className="w-4 h-4" />}
                    className="w-full sm:w-auto text-xs"
                  >
                    Download Payslips
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
