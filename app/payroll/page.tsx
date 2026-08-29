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
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
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
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function PayrollPage() {
  const router = useRouter();
  const { user, isSuperAdmin, currentRole } = useAuth();
  const { success, error } = useToast();

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion modal state
  const [deletingRun, setDeletingRun] = useState<PayrollRun | null>(null);
  const [isDeletingRun, setIsDeletingRun] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const isAdmin = isSuperAdmin || currentRole === "hr_admin";

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

  const handleConfirmDeleteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingRun) return;
    setIsDeletingRun(true);
    try {
      const res = await PayrollService.deletePayrollRun(
        deletingRun.id,
        {
          id: user?.id || "usr-superadmin-01",
          name: user?.displayName || "Super Admin",
          role: currentRole,
        },
        deleteReason.trim() || `Deleted ${deletingRun.periodName} cycle`
      );
      if (res) {
        success(
          "Payroll Cycle Deleted",
          `Successfully removed ${deletingRun.periodName} payroll run and its associated payslips from the server.`
        );
        setDeletingRun(null);
        loadData(false);
      } else {
        error("Delete Failed", "Failed to delete payroll cycle from server.");
      }
    } catch (err: any) {
      error("Error", err.message || "Failed to delete payroll cycle.");
    } finally {
      setIsDeletingRun(false);
    }
  };

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
            {payrollRuns.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Historical Payroll Cycles Found</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are currently no active or historical payroll runs in Google Cloud Firestore.
                </p>
              </div>
            ) : (
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/payslips")}
                            className="text-xs text-coral-600 hover:text-coral-700"
                          >
                            Payslips &rarr;
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeleteReason("");
                                setDeletingRun(run);
                              }}
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              title="Delete Payroll Cycle from Server"
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DELETE PAYROLL CYCLE MODAL */}
      <Modal
        isOpen={!!deletingRun}
        onClose={() => setDeletingRun(null)}
        title={`Delete Payroll Cycle: ${deletingRun?.periodName || ""}`}
        description="Permanently delete this payroll cycle and its cascaded records from Firestore."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDeleteRun} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">Permanent Data & Record Cascading Removal</p>
              <p>
                You are about to permanently delete the payroll cycle for <strong>{deletingRun?.periodName}</strong> ({deletingRun?.totalEmployees} staff, Net: {deletingRun ? formatINR(deletingRun.totalNetPayroll) : ""}).
              </p>
              <p className="mt-1">
                This action will automatically erase the payroll run record (<code className="font-mono">payrollRuns</code>), all calculated line items (<code className="font-mono">payrollItems</code>), and all generated payslips (<code className="font-mono">payslips</code>) from Google Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Deletion (Optional)
            </label>
            <textarea
              rows={2}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Re-running payroll cycle with updated attendance..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingRun(null)}
              disabled={isDeletingRun}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isDeletingRun}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
