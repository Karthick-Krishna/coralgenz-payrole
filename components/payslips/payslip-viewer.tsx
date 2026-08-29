"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Payslip, Organization } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { formatINR, formatDate } from "@/lib/utils";
import { printElement } from "@/lib/export/export-utils";
import {
  Download,
  Printer,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  AlertTriangle,
  Receipt,
  CreditCard,
  SlidersHorizontal,
  Save,
  FileCheck,
} from "lucide-react";

interface PayslipViewerProps {
  payslip: Payslip;
  organization: Organization;
  onRefresh?: () => void;
}

export function PayslipViewer({ payslip, organization, onRefresh }: PayslipViewerProps) {
  const router = useRouter();
  const { user, isSuperAdmin, currentRole } = useAuth();
  const { success, error } = useToast();

  const printContainerId = `payslip-print-${payslip.id}`;
  const isAdmin = isSuperAdmin || currentRole === "hr_admin";
  const isLocked = payslip.status === "locked" || payslip.locked;

  // Administrative Action States
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditReason, setAuditReason] = useState("");

  // Edit Form State
  const [editForm, setEditForm] = useState({
    payslipNumber: payslip.payslipNumber || "",
    panNumber: payslip.panNumber || "",
    bankName: payslip.bankName || "",
    ifscCode: payslip.ifscCode || "",
    workingDays: payslip.workingDays || 30,
    presentDays: payslip.presentDays || 30,
    leaveDays: payslip.leaveDays || 0,
    lossOfPayDays: payslip.lossOfPayDays || 0,
    basic: payslip.earnings?.basic || 0,
    hra: payslip.earnings?.hra || 0,
    conveyance: payslip.earnings?.conveyance || 0,
    medical: payslip.earnings?.medical || 0,
    specialAllowance: payslip.earnings?.specialAllowance || 0,
    bonus: payslip.earnings?.bonus || 0,
    overtime: payslip.earnings?.overtime || 0,
    otherEarnings: payslip.earnings?.other || 0,
    pf: payslip.deductions?.pf || 0,
    esi: payslip.deductions?.esi || 0,
    professionalTax: payslip.deductions?.professionalTax || 0,
    incomeTax: payslip.deductions?.incomeTax || 0,
    lossOfPay: payslip.deductions?.lossOfPay || 0,
    otherDeductions: payslip.deductions?.other || 0,
  });

  const handlePrint = () => {
    printElement(printContainerId);
  };

  // Lock Payslip
  const handleLockPayslip = async () => {
    setIsProcessing(true);
    try {
      const res = await PayrollService.lockPayslip(payslip.id, {
        id: user?.id || "usr-admin",
        name: user?.displayName || "Administrator",
        role: currentRole,
      });
      if (res) {
        success("Payslip Sealed & Locked", `Locked payslip ${payslip.payslipNumber}.`);
        onRefresh?.();
      } else {
        error("Lock Failed", "Could not lock payslip on server.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Unlock Payslip
  const handleUnlockPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      error("Reason Required", "Please provide a reason for unlocking this payslip.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await PayrollService.unlockPayslip(
        payslip.id,
        {
          id: user?.id || "usr-admin",
          name: user?.displayName || "Administrator",
          role: currentRole,
        },
        auditReason.trim()
      );
      if (res) {
        success("Payslip Unlocked", `Unlocked payslip ${payslip.payslipNumber} for modifications.`);
        setShowUnlockModal(false);
        setAuditReason("");
        onRefresh?.();
      } else {
        error("Unlock Failed", "Could not unlock payslip on server.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin Override Edit
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      error("Reason Required", "Please enter an administrative override reason for the audit log.");
      return;
    }

    setIsProcessing(true);
    try {
      const gross =
        Number(editForm.basic) +
        Number(editForm.hra) +
        Number(editForm.conveyance) +
        Number(editForm.medical) +
        Number(editForm.specialAllowance) +
        Number(editForm.bonus) +
        Number(editForm.overtime) +
        Number(editForm.otherEarnings);

      const deductionsTotal =
        Number(editForm.pf) +
        Number(editForm.esi) +
        Number(editForm.professionalTax) +
        Number(editForm.incomeTax) +
        Number(editForm.lossOfPay) +
        Number(editForm.otherDeductions);

      const net = gross - deductionsTotal;

      const updates: Partial<Payslip> = {
        payslipNumber: editForm.payslipNumber.trim() || payslip.payslipNumber,
        panNumber: editForm.panNumber.trim().toUpperCase(),
        bankName: editForm.bankName.trim(),
        ifscCode: editForm.ifscCode.trim().toUpperCase(),
        workingDays: Number(editForm.workingDays),
        presentDays: Number(editForm.presentDays),
        leaveDays: Number(editForm.leaveDays),
        lossOfPayDays: Number(editForm.lossOfPayDays),
        earnings: {
          basic: Number(editForm.basic),
          hra: Number(editForm.hra),
          conveyance: Number(editForm.conveyance),
          medical: Number(editForm.medical),
          specialAllowance: Number(editForm.specialAllowance),
          bonus: Number(editForm.bonus),
          overtime: Number(editForm.overtime),
          other: Number(editForm.otherEarnings),
        },
        deductions: {
          pf: Number(editForm.pf),
          esi: Number(editForm.esi),
          professionalTax: Number(editForm.professionalTax),
          incomeTax: Number(editForm.incomeTax),
          lossOfPay: Number(editForm.lossOfPay),
          loan: 0,
          advance: 0,
          other: Number(editForm.otherDeductions),
        },
        grossSalary: gross,
        totalDeductions: deductionsTotal,
        netSalary: net,
      };

      const res = await PayrollService.updateLockedPayslip(
        payslip.id,
        updates,
        {
          id: user?.id || "usr-admin",
          name: user?.displayName || "Administrator",
          role: currentRole,
        },
        auditReason.trim()
      );

      if (res) {
        success("Administrative Override Applied", "Updated payslip details and logged audit record on the server.");
        setShowOverrideModal(false);
        setAuditReason("");
        onRefresh?.();
      } else {
        error("Override Failed", "Could not apply administrative changes on server.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Payslip
  const handleDeletePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      error("Reason Required", "Please provide a reason for deleting this payslip.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await PayrollService.deletePayslip(
        payslip.id,
        {
          id: user?.id || "usr-admin",
          name: user?.displayName || "Administrator",
          role: currentRole,
        },
        auditReason.trim()
      );

      if (res) {
        success("Payslip Deleted", `Permanently removed payslip ${payslip.payslipNumber} and logged audit trail.`);
        setShowDeleteModal(false);
        router.push("/payslips");
      } else {
        error("Delete Failed", "Could not delete payslip from server.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Administrative Control Buttons */}
          {isAdmin && (
            <>
              {isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnlockModal(true)}
                  leftIcon={<Unlock className="w-3.5 h-3.5 text-amber-600" />}
                  className="text-xs"
                >
                  Unlock
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLockPayslip}
                  isLoading={isProcessing}
                  leftIcon={<Lock className="w-3.5 h-3.5 text-emerald-600" />}
                  className="text-xs"
                >
                  Lock
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAuditReason("");
                  setShowOverrideModal(true);
                }}
                leftIcon={<Pencil className="w-3.5 h-3.5 text-coral-600" />}
                className="text-xs"
              >
                Admin Override Edit
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setAuditReason("");
                  setShowDeleteModal(true);
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Delete
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs"
          >
            Print
          </Button>
          <Button
            variant="coral"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Administrative Status Ribbon */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 text-white shadow-md no-print text-xs border border-slate-800">
        <div className="flex items-center gap-2.5">
          {isLocked ? (
            <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3" />
              <span>SEALED & LOCKED</span>
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1 font-bold">
              <FileCheck className="w-3 h-3" />
              <span>DRAFT / PUBLISHED</span>
            </Badge>
          )}
          <span className="text-slate-300 hidden sm:inline">
            {isLocked
              ? `Immutable document sealed by ${payslip.lockedByName || "Super Admin"} on ${formatDate(payslip.lockedAt || payslip.generatedAt)}`
              : "Active payroll document ready for review and disbursement"}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Doc ID: {payslip.id}
        </div>
      </div>

      {/* Payslip Document Paper Container */}
      <div
        id={printContainerId}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl space-y-8 text-slate-800 dark:text-slate-200"
      >
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                <img src="/logo.png" alt="Coralgenz" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {organization.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Smart Payroll & Workforce Management
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <Badge variant="coral" size="sm" className="font-bold">
              PAYSLIP FOR {payslip.periodName.toUpperCase()}
            </Badge>
            <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
              Doc Ref: {payslip.payslipNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Pay Date: {formatDate(payslip.payDate)}
            </p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Employee Name</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{payslip.employeeName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Employee ID</span>
            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{payslip.employeeCode}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.departmentName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.designationTitle}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Bank Name</span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.bankName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Bank Account No.</span>
            <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.maskedAccountNumber}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Bank IFSC</span>
            <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.ifscCode}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">PAN Number</span>
            <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">{payslip.panNumber || "—"}</p>
          </div>
        </div>

        {/* Attendance Summary Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Working Days</span>
            <p className="font-bold">{payslip.workingDays}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Days Present</span>
            <p className="font-bold text-emerald-600">{payslip.presentDays}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Paid Leaves</span>
            <p className="font-bold text-blue-600">{payslip.leaveDays}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Loss of Pay (LOP)</span>
            <p className="font-bold text-rose-600">{payslip.lossOfPayDays}</p>
          </div>
        </div>

        {/* Earnings vs Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
              Earnings Components
            </h4>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                <span className="font-mono font-semibold">{formatINR(payslip.earnings.basic)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
                <span className="font-mono font-semibold">{formatINR(payslip.earnings.hra)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Conveyance Allowance</span>
                <span className="font-mono font-semibold">{formatINR(payslip.earnings.conveyance)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Medical Allowance</span>
                <span className="font-mono font-semibold">{formatINR(payslip.earnings.medical)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Special Allowance</span>
                <span className="font-mono font-semibold">{formatINR(payslip.earnings.specialAllowance)}</span>
              </div>
              {payslip.earnings.bonus > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Performance Bonus</span>
                  <span className="font-mono font-semibold">{formatINR(payslip.earnings.bonus)}</span>
                </div>
              )}
              {payslip.earnings.overtime > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Overtime Pay</span>
                  <span className="font-mono font-semibold">{formatINR(payslip.earnings.overtime)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold mt-3">
              <span>Total Gross Earnings (A)</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{formatINR(payslip.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
              Deductions & Statutory Taxes
            </h4>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Provident Fund (Employee PF 12%)</span>
                <span className="font-mono font-semibold text-rose-600">{formatINR(payslip.deductions.pf)}</span>
              </div>
              {payslip.deductions.esi > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Employee State Insurance (ESI 0.75%)</span>
                  <span className="font-mono font-semibold text-rose-600">{formatINR(payslip.deductions.esi)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Professional Tax (PT)</span>
                <span className="font-mono font-semibold text-rose-600">{formatINR(payslip.deductions.professionalTax)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600 dark:text-slate-400">Tax Deducted at Source (TDS / Income Tax)</span>
                <span className="font-mono font-semibold text-rose-600">{formatINR(payslip.deductions.incomeTax)}</span>
              </div>
              {payslip.deductions.lossOfPay > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Loss of Pay (LOP) Deduction</span>
                  <span className="font-mono font-semibold text-rose-600">{formatINR(payslip.deductions.lossOfPay)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold mt-3">
              <span>Total Deductions (B)</span>
              <span className="font-mono text-rose-600">{formatINR(payslip.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Final Net Pay Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-coral-400">
              Net Payable Amount (A − B)
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {formatINR(payslip.netSalary)}
            </div>
            <p className="text-xs text-slate-300 italic">
              {payslip.netSalaryInWords}
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <p>Employer PF Contribution: {formatINR(payslip.employerPf)}</p>
            {payslip.employerEsi > 0 && <p>Employer ESI Contribution: {formatINR(payslip.employerEsi)}</p>}
            <Badge variant="success" size="sm" className="mt-1">
              Direct Bank Deposit
            </Badge>
          </div>
        </div>

        {/* Footer Note and Authorized Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1 text-center sm:text-left">
            <p>This is a computer-generated document and requires no physical signature.</p>
            <p className="text-[10px]">Generated by Coralgenz Payrole • Smart Workforce & Payroll Engine</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
              Coralgenz Technologies Pvt. Ltd.
            </div>
            <span className="text-[10px] text-slate-400">Authorized Payroll Signatory</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: UNLOCK PAYSLIP */}
      <Modal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Unlock Payslip Document"
        description={`Unsealing ${payslip.payslipNumber} will allow salary adjustments. An audit trail entry will be created.`}
        maxWidth="md"
      >
        <form onSubmit={handleUnlockPayslip} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              Unlocking allows recalculation and edits. Please state the administrative reason for this unlock.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Unlocking <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Employee requested recalculation of overtime hours..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUnlockModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<Unlock className="w-4 h-4" />}
            >
              Confirm Unlock
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADMIN OVERRIDE EDIT */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title={`Administrative Override: ${payslip.employeeName}`}
        description={`Modify parameters for payslip ${payslip.payslipNumber}. This will update Firestore and write an immutable audit log.`}
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveOverride} className="space-y-5">
          {/* Security Alert */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Administrative Override Confirmation</p>
              <p>
                Editing this locked payslip will overwrite the database records and update the audit log with your administrative user ID, timestamp, and modification reason.
              </p>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span>Administrative Reason for Modification</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Retroactive performance bonus approval / statutory correction per HR request..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>

          {/* Live Math Banner */}
          {(() => {
            const liveGross =
              Number(editForm.basic) +
              Number(editForm.hra) +
              Number(editForm.conveyance) +
              Number(editForm.medical) +
              Number(editForm.specialAllowance) +
              Number(editForm.bonus) +
              Number(editForm.overtime) +
              Number(editForm.otherEarnings);

            const liveDeductions =
              Number(editForm.pf) +
              Number(editForm.esi) +
              Number(editForm.professionalTax) +
              Number(editForm.incomeTax) +
              Number(editForm.lossOfPay) +
              Number(editForm.otherDeductions);

            const liveNet = liveGross - liveDeductions;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">New Gross</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">{formatINR(liveGross)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Total Deductions</span>
                  <p className="text-base font-bold font-mono text-rose-400 mt-0.5">{formatINR(liveDeductions)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-coral-400 font-bold">New Net Payable</span>
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
                label="Doc Ref / Payslip No"
                required
                value={editForm.payslipNumber}
                onChange={(e) => setEditForm({ ...editForm, payslipNumber: e.target.value })}
              />
              <Input
                label="PAN Number"
                value={editForm.panNumber}
                onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })}
                maxLength={10}
              />
              <Input
                label="Bank Name"
                value={editForm.bankName}
                onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
              />
            </div>
          </div>

          {/* Attendance Days Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>Attendance Days</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Working Days"
                type="number"
                value={editForm.workingDays}
                onChange={(e) => setEditForm({ ...editForm, workingDays: Number(e.target.value) })}
              />
              <Input
                label="Days Present"
                type="number"
                value={editForm.presentDays}
                onChange={(e) => setEditForm({ ...editForm, presentDays: Number(e.target.value) })}
              />
              <Input
                label="Paid Leaves"
                type="number"
                value={editForm.leaveDays}
                onChange={(e) => setEditForm({ ...editForm, leaveDays: Number(e.target.value) })}
              />
              <Input
                label="LOP Days"
                type="number"
                value={editForm.lossOfPayDays}
                onChange={(e) => setEditForm({ ...editForm, lossOfPayDays: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              <span>Earnings (INR)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Basic Salary"
                type="number"
                value={editForm.basic}
                onChange={(e) => setEditForm({ ...editForm, basic: Number(e.target.value) })}
              />
              <Input
                label="HRA"
                type="number"
                value={editForm.hra}
                onChange={(e) => setEditForm({ ...editForm, hra: Number(e.target.value) })}
              />
              <Input
                label="Conveyance"
                type="number"
                value={editForm.conveyance}
                onChange={(e) => setEditForm({ ...editForm, conveyance: Number(e.target.value) })}
              />
              <Input
                label="Medical"
                type="number"
                value={editForm.medical}
                onChange={(e) => setEditForm({ ...editForm, medical: Number(e.target.value) })}
              />
              <Input
                label="Special Allowance"
                type="number"
                value={editForm.specialAllowance}
                onChange={(e) => setEditForm({ ...editForm, specialAllowance: Number(e.target.value) })}
              />
              <Input
                label="Bonus"
                type="number"
                value={editForm.bonus}
                onChange={(e) => setEditForm({ ...editForm, bonus: Number(e.target.value) })}
              />
              <Input
                label="Overtime Pay"
                type="number"
                value={editForm.overtime}
                onChange={(e) => setEditForm({ ...editForm, overtime: Number(e.target.value) })}
              />
              <Input
                label="Other Earnings"
                type="number"
                value={editForm.otherEarnings}
                onChange={(e) => setEditForm({ ...editForm, otherEarnings: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
              <span>Deductions (INR)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Provident Fund (PF)"
                type="number"
                value={editForm.pf}
                onChange={(e) => setEditForm({ ...editForm, pf: Number(e.target.value) })}
              />
              <Input
                label="ESI"
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
                value={editForm.incomeTax}
                onChange={(e) => setEditForm({ ...editForm, incomeTax: Number(e.target.value) })}
              />
              <Input
                label="LOP Deduction"
                type="number"
                value={editForm.lossOfPay}
                onChange={(e) => setEditForm({ ...editForm, lossOfPay: Number(e.target.value) })}
              />
              <Input
                label="Other Deductions"
                type="number"
                value={editForm.otherDeductions}
                onChange={(e) => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOverrideModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Apply Administrative Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: DELETE PAYSLIP */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete Payslip"
        description={`This action will permanently delete payslip ${payslip.payslipNumber} and log an administrative audit record.`}
        maxWidth="md"
      >
        <form onSubmit={handleDeletePayslip} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">Irreversible Deletion</p>
              <p>
                Deleting this payslip is a privileged action and will remove it permanently from Google Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Deletion <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Duplicate payslip generated by error..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
