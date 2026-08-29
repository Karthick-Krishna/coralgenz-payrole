"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { useAuth } from "@/lib/auth/auth-context";
import { Employee, PayrollRun, PayrollItem, Payslip } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import { exportToCSV, exportToExcel } from "@/lib/export/export-utils";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Download,
  Users,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Pencil,
  FileText,
  Receipt,
  Save,
  SlidersHorizontal,
} from "lucide-react";

interface PayrollProcessWizardProps {
  employees: Employee[];
}

export function PayrollProcessWizard({ employees }: PayrollProcessWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [periodName, setPeriodName] = useState("August 2026");
  const [payDate, setPayDate] = useState("2026-08-31");

  const [generatedRun, setGeneratedRun] = useState<PayrollRun | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [generatedPayslips, setGeneratedPayslips] = useState<Payslip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Payslip Details & Ref No State
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    payslipNumber: "",
    panNumber: "",
    bankAccountNumber: "",
    bankName: "",
    ifscCode: "",
    totalWorkingDays: 30,
    daysPresent: 30,
    daysOnLeave: 0,
    daysLossOfPay: 0,
    basicSalary: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    performanceBonus: 0,
    overtimePay: 0,
    otherEarnings: 0,
    providentFund: 0,
    esi: 0,
    professionalTax: 0,
    incomeTaxTDS: 0,
    lossOfPayDeduction: 0,
    otherDeductions: 0,
  });

  // Month change
  const handleMonthChange = (m: number) => {
    setSelectedMonth(m);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    setPeriodName(`${months[m - 1]} ${selectedYear}`);
  };

  // Step 2 -> 3: Compute Payroll Run
  const handleComputePayroll = async () => {
    setIsProcessing(true);
    try {
      const res = await PayrollService.processPayrollRun({
        month: selectedMonth,
        year: selectedYear,
        periodName,
        startDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
        endDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-28`,
        paymentDate: payDate,
        processedBy: user?.id || "usr-superadmin-01",
        processedByName: user?.displayName || "Super Admin",
      });

      if (res.success && res.run && res.items) {
        setGeneratedRun(res.run);
        setPayrollItems(res.items);
        setStep(3);
      } else {
        error("Process Error", res.error || "Failed to calculate payroll.");
      }
    } catch (err: any) {
      error("Process Error", err.message || "Failed to calculate payroll.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Edit Modal for a Specific Employee's Payslip Details & Ref No
  const handleOpenEdit = (item: PayrollItem) => {
    setEditingItem(item);
    setEditForm({
      payslipNumber: item.payslipNumber || item.refNo || "",
      panNumber: item.panNumber || "",
      bankAccountNumber: item.bankAccountNumber || "",
      bankName: item.bankName || "",
      ifscCode: item.ifscCode || "",
      totalWorkingDays: item.totalWorkingDays ?? 30,
      daysPresent: item.daysPresent ?? 30,
      daysOnLeave: item.daysOnLeave ?? 0,
      daysLossOfPay: item.daysLossOfPay ?? 0,
      basicSalary: item.basicSalary ?? 0,
      hra: item.hra ?? 0,
      conveyanceAllowance: item.conveyanceAllowance ?? 0,
      medicalAllowance: item.medicalAllowance ?? 0,
      specialAllowance: item.specialAllowance ?? 0,
      performanceBonus: item.performanceBonus ?? 0,
      overtimePay: item.overtimePay ?? 0,
      otherEarnings: item.otherEarnings ?? 0,
      providentFund: item.providentFund ?? 0,
      esi: item.esi ?? 0,
      professionalTax: item.professionalTax ?? 0,
      incomeTaxTDS: item.incomeTaxTDS ?? 0,
      lossOfPayDeduction: item.lossOfPayDeduction ?? 0,
      otherDeductions: item.otherDeductions ?? 0,
    });
    setIsEditModalOpen(true);
  };

  // Save Item Edit and Recalculate Run Totals
  const handleSaveItemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const gross =
      Number(editForm.basicSalary) +
      Number(editForm.hra) +
      Number(editForm.conveyanceAllowance) +
      Number(editForm.medicalAllowance) +
      Number(editForm.specialAllowance) +
      Number(editForm.performanceBonus) +
      Number(editForm.overtimePay) +
      Number(editForm.otherEarnings);

    const deductions =
      Number(editForm.providentFund) +
      Number(editForm.esi) +
      Number(editForm.professionalTax) +
      Number(editForm.incomeTaxTDS) +
      Number(editForm.lossOfPayDeduction) +
      Number(editForm.otherDeductions);

    const net = gross - deductions;

    const updatedItem: PayrollItem = {
      ...editingItem,
      payslipNumber: editForm.payslipNumber.trim() || editingItem.payslipNumber,
      refNo: editForm.payslipNumber.trim() || editingItem.refNo,
      panNumber: editForm.panNumber.trim().toUpperCase(),
      bankAccountNumber: editForm.bankAccountNumber.trim(),
      bankName: editForm.bankName.trim(),
      ifscCode: editForm.ifscCode.trim().toUpperCase(),
      totalWorkingDays: Number(editForm.totalWorkingDays),
      daysPresent: Number(editForm.daysPresent),
      daysOnLeave: Number(editForm.daysOnLeave),
      daysLossOfPay: Number(editForm.daysLossOfPay),
      basicSalary: Number(editForm.basicSalary),
      hra: Number(editForm.hra),
      conveyanceAllowance: Number(editForm.conveyanceAllowance),
      medicalAllowance: Number(editForm.medicalAllowance),
      specialAllowance: Number(editForm.specialAllowance),
      performanceBonus: Number(editForm.performanceBonus),
      overtimePay: Number(editForm.overtimePay),
      otherEarnings: Number(editForm.otherEarnings),
      grossSalary: gross,
      providentFund: Number(editForm.providentFund),
      esi: Number(editForm.esi),
      professionalTax: Number(editForm.professionalTax),
      incomeTaxTDS: Number(editForm.incomeTaxTDS),
      lossOfPayDeduction: Number(editForm.lossOfPayDeduction),
      otherDeductions: Number(editForm.otherDeductions),
      totalDeductions: deductions,
      netSalary: net,
    };

    const updatedList = payrollItems.map((item) => (item.id === editingItem.id ? updatedItem : item));
    setPayrollItems(updatedList);

    // Recalculate run totals
    const totalGross = updatedList.reduce((sum, it) => sum + (Number(it.grossSalary) || 0), 0);
    const totalDeductions = updatedList.reduce((sum, it) => sum + (Number(it.totalDeductions) || 0), 0);
    const totalNet = updatedList.reduce((sum, it) => sum + (Number(it.netSalary) || 0), 0);

    if (generatedRun) {
      setGeneratedRun({
        ...generatedRun,
        totalGrossPayroll: totalGross,
        totalDeductions,
        totalNetPayroll: totalNet,
      });
    }

    setIsEditModalOpen(false);
    success("Payslip Updated", `Updated compensation & Ref No (${updatedItem.payslipNumber}) for ${editingItem.employeeName}`);
  };

  // Step 4 -> 5: Lock Payroll & Generate Payslips
  const handleLockAndGenerate = async () => {
    if (!generatedRun) return;
    setIsProcessing(true);
    try {
      const res = await PayrollService.lockAndPublishPayroll({
        runId: generatedRun.id,
        run: generatedRun,
        items: payrollItems,
        approvedBy: user?.id || "usr-superadmin-01",
        approvedByName: user?.displayName || "Super Admin",
      });

      if (res.success && res.run && res.payslips) {
        setGeneratedRun(res.run);
        setGeneratedPayslips(res.payslips);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        success("Payroll Locked & Payslips Published", `Successfully generated ${res.payslips.length} employee payslips on the server.`);
        setStep(5);
      } else {
        error("Lock Failed", res.error || "Could not lock payroll run.");
      }
    } catch (err: any) {
      error("Lock Failed", err.message || "Could not lock payroll run.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportBankTransfer = () => {
    const data = payrollItems.map((item) => ({
      "Beneficiary Name": item.employeeName,
      "Account Number": item.bankAccountNumber,
      "IFSC Code": item.ifscCode,
      "Bank Name": item.bankName,
      "Amount (INR)": item.netSalary,
      "Transaction Narrative": `Salary for ${periodName}`,
      "Employee ID": item.employeeCode,
    }));
    exportToCSV(data, `Coralgenz_Bank_Disbursement_${selectedYear}_${selectedMonth}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stepper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Execute Payroll Cycle
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated statutory calculations, verification preview, immutable locking, and batch payslip generation.
          </p>
        </div>

        <Badge variant="coral" size="lg">
          Step {step} of 5: {step === 1 ? "Period" : step === 2 ? "Verify Roster" : step === 3 ? "Review Preview" : step === 4 ? "Approval" : "Completed"}
        </Badge>
      </div>

      {/* STEP 1: SELECT MONTH & DATES */}
      {step === 1 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle>1. Select Payroll Month & Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Payroll Month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
              >
                <option value={8}>August (Current Cycle)</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </Select>

              <Select
                label="Financial Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value={2026}>2026 (FY 2026-27)</option>
                <option value={2027}>2027 (FY 2027-28)</option>
              </Select>

              <Input
                label="Disbursement Date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-2xl bg-coral-50/50 dark:bg-coral-950/20 border border-coral-200 dark:border-coral-800 text-xs space-y-1.5">
              <h4 className="font-bold text-coral-800 dark:text-coral-300 uppercase text-[10px]">
                Cycle Configuration Summary:
              </h4>
              <p>• Period Name: <span className="font-bold">{periodName}</span></p>
              <p>• Active Employees to Process: <span className="font-bold">{employees.filter((e) => e.status === "active" || e.status === "probation").length} Eligible</span></p>
              <p>• Statutory Rules: Indian Provident Fund (12%), ESI (0.75%), Professional Tax (Karnataka ₹200 slab), TDS Estimation</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="outline" size="sm" onClick={() => router.push("/payroll")}>
              Cancel
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Active Roster &rarr;
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: VERIFY ACTIVE ROSTER & ATTENDANCE */}
      {step === 2 && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>2. Verify Active Employees & Attendance</CardTitle>
              <p className="text-xs text-slate-500">Checking eligibility and attendance logs for {periodName}</p>
            </div>
            <Badge variant="success" size="sm">
              {employees.length} Eligible Employees
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Standard Working Days</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">22 Days</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Leaves</span>
                <div className="text-xl font-bold text-emerald-600">3 Days Total</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Loss of Pay (LOP)</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">0 Days</div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Gross</TableHead>
                  <TableHead>Salary Structure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.slice(0, 6).map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <span className="font-bold">{emp.firstName} {emp.lastName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{emp.id}</span>
                    </TableCell>
                    <TableCell>{emp.departmentName}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">{emp.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{formatINR(emp.currentMonthlyGross)}</TableCell>
                    <TableCell className="text-xs text-slate-500">Standard IT CTC</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="coral"
              size="sm"
              isLoading={isProcessing}
              onClick={handleComputePayroll}
              rightIcon={<PlayCircle className="w-4 h-4" />}
            >
              Run Calculation Engine &rarr;
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: PREVIEW & REVIEW CALCULATIONS */}
      {step === 3 && generatedRun && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>3. Payroll Calculation Preview ({periodName})</CardTitle>
              <p className="text-xs text-slate-500">Detailed breakdown of gross earnings, statutory deductions, and net payouts</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportBankTransfer} leftIcon={<Download className="w-4 h-4" />}>
                Export Sheet
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Gross Payroll</span>
                <div className="text-lg font-black">{formatINR(generatedRun.totalGrossPayroll)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</span>
                <div className="text-lg font-black text-rose-400">{formatINR(generatedRun.totalDeductions)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Net Disbursement</span>
                <div className="text-lg font-black text-emerald-400">{formatINR(generatedRun.totalNetPayroll)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Employees Processed</span>
                <div className="text-lg font-black">{generatedRun.totalEmployees}</div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Payslip Ref No</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>HRA</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>PF / Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.employeeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.employeeCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                          {item.payslipNumber || item.refNo || "Auto"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatINR(item.basicSalary)}</TableCell>
                      <TableCell className="font-mono text-xs">{formatINR(item.hra)}</TableCell>
                      <TableCell className="font-mono text-xs">{formatINR((item.specialAllowance || 0) + (item.conveyanceAllowance || 0) + (item.medicalAllowance || 0) + (item.performanceBonus || 0) + (item.overtimePay || 0))}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{formatINR(item.grossSalary)}</TableCell>
                      <TableCell className="font-mono text-xs text-rose-600">{formatINR(item.totalDeductions)}</TableCell>
                      <TableCell className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{formatINR(item.netSalary)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          leftIcon={<Pencil className="w-3.5 h-3.5 text-coral-600" />}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={() => setStep(4)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Executive Sign-off &rarr;
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: EXECUTIVE SIGN-OFF & LOCK */}
      {step === 4 && generatedRun && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle>4. Executive Approval & Payroll Lock Confirmation</CardTitle>
            <p className="text-xs text-slate-500">Security checkpoint: Locking freezes all salary and attendance parameters permanently</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Important Security & Audit Policy:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Once locked, this payroll run ({periodName}) will be permanently sealed. Individual payslips will be generated and published to all {generatedRun.totalEmployees} employees immediately.
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                • Total Disbursable Net Amount: <span className="font-bold text-slate-900 dark:text-slate-100">{formatINR(generatedRun.totalNetPayroll)}</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                • Total Statutory Contributions (PF + ESI + PT + TDS): <span className="font-bold text-slate-900 dark:text-slate-100">{formatINR(generatedRun.totalDeductions)}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Preview
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              onClick={handleLockAndGenerate}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Confirm Lock & Publish Payslips
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: CELEBRATION & PAYSLIPS GENERATED */}
      {step === 5 && generatedRun && (
        <Card className="animate-in zoom-in-95 duration-200 text-center py-8">
          <CardContent className="space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Payroll Locked & Published! 🎉
              </h2>
              <p className="text-xs text-slate-500">
                {periodName} payroll cycle has been processed and locked. {generatedPayslips.length} individual employee payslips have been created and dispatched.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Net Disbursed:</span>
                <span className="font-bold text-emerald-600 font-mono">{formatINR(generatedRun.totalNetPayroll)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Statutory Taxes:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatINR(generatedRun.totalDeductions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Disbursement File:</span>
                <span className="font-bold text-coral-600 font-mono">Ready for NEFT Batch</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="coral"
                size="sm"
                onClick={handleExportBankTransfer}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download Bank NEFT Batch File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/payslips")}
                leftIcon={<FileCheck className="w-4 h-4" />}
              >
                View Generated Payslips
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* EDIT PAYSLIP & REF NO MODAL */}
      {editingItem && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Payslip & Ref No: ${editingItem.employeeName}`}
          description={`Customize salary components, deductions, Ref No, and PAN before generating final payslip`}
          maxWidth="3xl"
        >
          <form onSubmit={handleSaveItemEdit} className="space-y-5">
            {/* Live Calculation Banner */}
            {(() => {
              const liveGross =
                Number(editForm.basicSalary) +
                Number(editForm.hra) +
                Number(editForm.conveyanceAllowance) +
                Number(editForm.medicalAllowance) +
                Number(editForm.specialAllowance) +
                Number(editForm.performanceBonus) +
                Number(editForm.overtimePay) +
                Number(editForm.otherEarnings);

              const liveDeductions =
                Number(editForm.providentFund) +
                Number(editForm.esi) +
                Number(editForm.professionalTax) +
                Number(editForm.incomeTaxTDS) +
                Number(editForm.lossOfPayDeduction) +
                Number(editForm.otherDeductions);

              const liveNet = liveGross - liveDeductions;

              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Calculated Gross</span>
                    <p className="text-base font-bold font-mono text-white mt-0.5">{formatINR(liveGross)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Total Deductions</span>
                    <p className="text-base font-bold font-mono text-rose-400 mt-0.5">{formatINR(liveDeductions)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-coral-400 font-bold">Net Payable</span>
                    <p className="text-base font-black font-mono text-emerald-400 mt-0.5">{formatINR(liveNet)}</p>
                  </div>
                </div>
              );
            })()}

            {/* Document Reference & Identity Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-coral-500" />
                <span>Document Reference & Employee Info</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Payslip Ref No / Doc ID"
                  required
                  value={editForm.payslipNumber}
                  onChange={(e) => setEditForm({ ...editForm, payslipNumber: e.target.value })}
                  placeholder="e.g. CGG-PS-2026-08-0001"
                  helperText="Customizable reference number printed on payslip"
                />
                <Input
                  label="Employee PAN Number"
                  value={editForm.panNumber}
                  onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
                <Input
                  label="Bank Account Number"
                  value={editForm.bankAccountNumber}
                  onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value })}
                  placeholder="e.g. 50100123456789"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Bank Name"
                  value={editForm.bankName}
                  onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                  placeholder="HDFC Bank"
                />
                <Input
                  label="Bank IFSC Code"
                  value={editForm.ifscCode}
                  onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="HDFC0000240"
                />
              </div>
            </div>

            {/* Attendance Days Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Attendance & Work Days</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="Working Days"
                  type="number"
                  value={editForm.totalWorkingDays}
                  onChange={(e) => setEditForm({ ...editForm, totalWorkingDays: Number(e.target.value) })}
                />
                <Input
                  label="Days Present"
                  type="number"
                  value={editForm.daysPresent}
                  onChange={(e) => setEditForm({ ...editForm, daysPresent: Number(e.target.value) })}
                />
                <Input
                  label="Paid Leaves"
                  type="number"
                  value={editForm.daysOnLeave}
                  onChange={(e) => setEditForm({ ...editForm, daysOnLeave: Number(e.target.value) })}
                />
                <Input
                  label="Loss of Pay Days"
                  type="number"
                  value={editForm.daysLossOfPay}
                  onChange={(e) => setEditForm({ ...editForm, daysLossOfPay: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Earnings Components Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>Earnings Breakdown (INR)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="Basic Salary"
                  type="number"
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                />
                <Input
                  label="HRA"
                  type="number"
                  value={editForm.hra}
                  onChange={(e) => setEditForm({ ...editForm, hra: Number(e.target.value) })}
                />
                <Input
                  label="Conveyance Allowance"
                  type="number"
                  value={editForm.conveyanceAllowance}
                  onChange={(e) => setEditForm({ ...editForm, conveyanceAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Medical Allowance"
                  type="number"
                  value={editForm.medicalAllowance}
                  onChange={(e) => setEditForm({ ...editForm, medicalAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Special Allowance"
                  type="number"
                  value={editForm.specialAllowance}
                  onChange={(e) => setEditForm({ ...editForm, specialAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Performance Bonus"
                  type="number"
                  value={editForm.performanceBonus}
                  onChange={(e) => setEditForm({ ...editForm, performanceBonus: Number(e.target.value) })}
                />
                <Input
                  label="Overtime Pay"
                  type="number"
                  value={editForm.overtimePay}
                  onChange={(e) => setEditForm({ ...editForm, overtimePay: Number(e.target.value) })}
                />
                <Input
                  label="Other Earnings"
                  type="number"
                  value={editForm.otherEarnings}
                  onChange={(e) => setEditForm({ ...editForm, otherEarnings: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Deductions & Statutory Taxes Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                <span>Deductions & Statutory Taxes (INR)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  label="Provident Fund (PF)"
                  type="number"
                  value={editForm.providentFund}
                  onChange={(e) => setEditForm({ ...editForm, providentFund: Number(e.target.value) })}
                />
                <Input
                  label="Employee ESI"
                  type="number"
                  value={editForm.esi}
                  onChange={(e) => setEditForm({ ...editForm, esi: Number(e.target.value) })}
                />
                <Input
                  label="Professional Tax (PT)"
                  type="number"
                  value={editForm.professionalTax}
                  onChange={(e) => setEditForm({ ...editForm, professionalTax: Number(e.target.value) })}
                />
                <Input
                  label="TDS / Income Tax"
                  type="number"
                  value={editForm.incomeTaxTDS}
                  onChange={(e) => setEditForm({ ...editForm, incomeTaxTDS: Number(e.target.value) })}
                />
                <Input
                  label="Loss of Pay (LOP) Deduction"
                  type="number"
                  value={editForm.lossOfPayDeduction}
                  onChange={(e) => setEditForm({ ...editForm, lossOfPayDeduction: Number(e.target.value) })}
                />
                <Input
                  label="Other Deductions"
                  type="number"
                  value={editForm.otherDeductions}
                  onChange={(e) => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="coral"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Apply Changes to Run
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
