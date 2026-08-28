"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { PayrollRun, Employee } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import {
  CreditCard,
  PlayCircle,
  Settings,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function PayrollPage() {
  const router = useRouter();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [runs, emps] = await Promise.all([
        PayrollService.getPayrollRuns(),
        EmployeeService.getEmployees(),
      ]);
      setPayrollRuns(runs);
      setEmployees(emps);
    } catch (e) {
      console.error("Error loading payroll data:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleStoreUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  const latestRun = payrollRuns[0];

  return (
    <AppLayout module="payroll">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Payroll Processing Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monthly compensation cycles, Indian statutory compliance (PF/ESI/PT/TDS), payroll locking, and payslips.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/payroll/structures")}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Salary Structures
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={() => router.push("/payroll/process")}
              leftIcon={<PlayCircle className="w-4 h-4" />}
            >
              Execute Payroll Run
            </Button>
          </div>
        </div>

        {/* Current Cycle Highlight Banner */}
        <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-coral-950 text-white border-none shadow-xl">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="coral" size="sm">
                  Active Cycle
                </Badge>
                <span className="text-xs text-slate-400">
                  August 2026 Payroll
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready for Calculation & Disbursement
              </h2>
              <p className="text-xs text-slate-300 max-w-lg">
                10 active employees with biometric attendance records, approved leaves, and standard IT tax structures.
              </p>
            </div>

            <Button
              variant="coral"
              size="lg"
              onClick={() => router.push("/payroll/process")}
              leftIcon={<PlayCircle className="w-5 h-5" />}
              className="font-bold shadow-lg shadow-coral-500/30 shrink-0"
            >
              Start August Payroll Wizard &rarr;
            </Button>
          </CardContent>
        </Card>

        {/* Historical Payroll Runs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historical Payroll Cycles</CardTitle>
              <p className="text-xs text-slate-500">Official sealed and disbursed payroll runs</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/payslips")}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              View All Payslips
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross Payroll</TableHead>
                  <TableHead>Total Taxes / Deductions</TableHead>
                  <TableHead>Net Disbursement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {run.periodName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Disbursed: {formatDate(run.paymentDate)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold">{run.totalEmployees} Staff</span>
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold">
                      {formatINR(run.totalGrossPayroll)}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-rose-600">
                      {formatINR(run.totalDeductions)}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatINR(run.totalNetPayroll)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={run.status === "locked" || run.status === "paid" ? "success" : "coral"}
                        size="sm"
                        dot
                      >
                        {run.status.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/payslips")}
                        className="text-xs text-coral-600 hover:text-coral-700"
                      >
                        Payslips &rarr;
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
