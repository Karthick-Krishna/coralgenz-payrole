"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { Payslip, Organization } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { printElement } from "@/lib/export/export-utils";
import {
  Download,
  Printer,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface PayslipViewerProps {
  payslip: Payslip;
  organization: Organization;
}

export function PayslipViewer({ payslip, organization }: PayslipViewerProps) {
  const router = useRouter();
  const printContainerId = `payslip-print-${payslip.id}`;

  const handlePrint = () => {
    printElement(printContainerId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Actions Toolbar */}
      <div className="flex items-center justify-between no-print">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Payslip
          </Button>
          <Button
            variant="coral"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PDF
          </Button>
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
              <div className="w-9 h-9 rounded-xl bg-coral-500 text-white font-bold flex items-center justify-center text-lg">
                C
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {organization.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {organization.address}, {organization.city}, {organization.state}, {organization.country} - {organization.postalCode}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              CIN/GSTIN: {organization.gstin || "29AAACC1234K1Z5"} • PAN: {organization.panNumber || "AAACC1234K"}
            </p>
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
            <span className="text-[10px] uppercase font-bold text-slate-400">UAN / PF No.</span>
            <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">{payslip.uanNumber || "100987654321"}</p>
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
    </div>
  );
}
