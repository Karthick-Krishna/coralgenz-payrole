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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-950 via-blue-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-800/40">
        <div className="space-y-1">
          <Badge variant="purple" size="sm" className="bg-white/20 text-white border-none">
            Payroll & Statutory Processing Suite
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Payroll Management Dashboard
          </h1>
          <p className="text-xs text-white/80">
            Calculate earnings, deductions (PF, ESI, PT, TDS), review calculations, lock payroll cycles, and generate payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/payroll/process")}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Process Current Payroll
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/payroll/structures")}
            className="text-white border-white/30 hover:bg-white/10"
          >
            Salary Structures
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card hoverEffect>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="coral" size="md">
                August 2026 Ready
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{activeEmployees.length} Eligible Employees</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Gross</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {formatINR(844000)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Basic + HRA + Allowances</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Deductions</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {formatINR(81550)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">PF + ESI + PT + TDS</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursable Net</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(762450)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Direct Bank Transfer</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Processing Workflow Stepper Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Payroll Cycle Workflow (August 2026)</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard 6-step compliance & disbursement workflow
            </p>
          </div>
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/payroll/process")}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Start Processing Wizard
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {[
              { step: 1, label: "Month Select", desc: "August 2026", status: "completed" },
              { step: 2, label: "Fetch Attendance", desc: "10 Employees", status: "completed" },
              { step: 3, label: "Calculate PF/Tax", desc: "Statutory rules", status: "completed" },
              { step: 4, label: "Preview Table", desc: "Review items", status: "current" },
              { step: 5, label: "Lock & Protect", desc: "Immutable freeze", status: "upcoming" },
              { step: 6, label: "Batch Payslips", desc: "PDF & Publish", status: "upcoming" },
            ].map((s) => (
              <div
                key={s.step}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-coral-500 text-white font-bold text-xs flex items-center justify-center">
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
                  >
                    {s.status}
                  </Badge>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.label}</h5>
                <p className="text-[10px] text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Payroll Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payroll History & Processed Runs</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit-verified historical payroll disbursements
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/payslips")}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            All Payslips
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
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

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/payslips")}
                    leftIcon={<Download className="w-4 h-4" />}
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
