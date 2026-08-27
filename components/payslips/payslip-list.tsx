"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Payslip } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { exportToCSV } from "@/lib/export/export-utils";
import {
  FileSpreadsheet,
  Search,
  Eye,
  Download,
  Printer,
  FileCheck,
  ChevronRight,
} from "lucide-react";

interface PayslipListProps {
  payslips: Payslip[];
  isEmployeeView?: boolean;
}

export function PayslipList({
  payslips,
  isEmployeeView = false,
}: PayslipListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  const filteredPayslips = payslips.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.employeeName.toLowerCase().includes(q) ||
      p.employeeCode.toLowerCase().includes(q) ||
      p.payslipNumber.toLowerCase().includes(q);

    const matchesPeriod = periodFilter === "all" || p.periodName === periodFilter;
    return matchesQuery && matchesPeriod;
  });

  const handleExportCSV = () => {
    const data = filteredPayslips.map((p) => ({
      "Payslip Number": p.payslipNumber,
      "Employee Name": p.employeeName,
      "Employee ID": p.employeeCode,
      Period: p.periodName,
      "Pay Date": p.payDate,
      "Gross Salary (INR)": p.grossSalary,
      "Total Deductions (INR)": p.totalDeductions,
      "Net Salary (INR)": p.netSalary,
      "Bank Account": p.maskedAccountNumber,
    }));
    exportToCSV(data, "Coralgenz_Payslips_Registry");
  };

  const uniquePeriods = Array.from(new Set(payslips.map((p) => p.periodName)));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isEmployeeView ? "My Payslips" : "Payslip Registry"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEmployeeView
              ? "Access and download your verified monthly salary payslips."
              : "Organization-wide published payslips, breakdown archives, and bank receipts."}
          </p>
        </div>

        {!isEmployeeView && (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="w-full sm:w-auto text-xs"
            >
              Export CSV Registry
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <Input
              placeholder="Search name, ID, or payslip number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="text-xs"
            />

            <Select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Pay Periods</option>
              {uniquePeriods.map((per) => (
                <option key={per} value={per}>
                  {per}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredPayslips.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-slate-400">
              <TableEmptyState
                icon={<FileSpreadsheet className="w-8 h-8" />}
                title="No payslips found"
                description="No payslip documents match the selected filters."
              />
            </CardContent>
          </Card>
        ) : (
          filteredPayslips.map((ps) => (
            <div
              key={ps.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-coral-600 dark:text-coral-400 block">
                    {ps.payslipNumber}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block mt-0.5">
                    {ps.employeeName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{ps.employeeCode}</span>
                </div>
                <Badge variant="coral" size="sm">
                  {ps.periodName}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Gross</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatINR(ps.grossSalary)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Deductions</span>
                  <span className="font-mono font-medium text-rose-500">
                    {formatINR(ps.totalDeductions)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Net Salary</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {formatINR(ps.netSalary)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] text-slate-400">
                  Paid on {formatDate(ps.payDate)}
                </span>

                <Button
                  variant="coral"
                  size="sm"
                  onClick={() => router.push(`/payslips/${ps.id}`)}
                  className="h-8 px-3 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View & PDF
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payslip Number</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Pay Period</TableHead>
              <TableHead>Gross Salary</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Pay Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayslips.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <TableEmptyState
                    icon={<FileSpreadsheet className="w-8 h-8" />}
                    title="No payslips found"
                    description="No payslip documents match the selected filters."
                  />
                </td>
              </tr>
            ) : (
              filteredPayslips.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell>
                    <span className="font-mono font-bold text-xs text-coral-600 dark:text-coral-400">
                      {ps.payslipNumber}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {ps.employeeName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{ps.employeeCode}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="coral" size="sm">
                      {ps.periodName}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {formatINR(ps.grossSalary)}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-rose-600">
                    {formatINR(ps.totalDeductions)}
                  </TableCell>

                  <TableCell className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {formatINR(ps.netSalary)}
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {formatDate(ps.payDate)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/payslips/${ps.id}`)}
                        title="View & Download Payslip"
                        className="h-8 px-2.5 text-xs text-coral-600 hover:text-coral-700"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
