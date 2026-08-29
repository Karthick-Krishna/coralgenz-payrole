import {
  Employee,
  PayrollItem,
  PayrollRun,
  Payslip,
  SalaryStructure,
  StatutoryRulesConfig,
  Organization,
} from "@/types";
import { numberToWordsIndian } from "@/lib/utils";

export const DEFAULT_STATUTORY_CONFIG: StatutoryRulesConfig = {
  pfEnabled: true,
  pfEmployeePercent: 12,
  pfEmployerPercent: 12,
  pfWageCeiling: 15000,
  esiEnabled: true,
  esiEmployeePercent: 0.75,
  esiEmployerPercent: 3.25,
  esiWageCeiling: 21000,
  ptEnabled: true,
  ptMonthlyFlat: 200,
  ptSlabs: [
    { minSalary: 0, maxSalary: 15000, taxAmount: 0 },
    { minSalary: 15001, maxSalary: 20000, taxAmount: 150 },
    { minSalary: 20001, maxSalary: 999999999, taxAmount: 200 },
  ],
  tdsEnabled: true,
  gratuityEnabled: true,
  gratuityPercent: 4.81,
};

export interface EmployeeAttendanceData {
  workingDays: number;
  presentDays: number;
  leaveDays: number; // Approved paid leaves
  lossOfPayDays: number; // Unpaid or unapproved absence
  overtimeHours: number;
  bonusAmount?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  customTds?: number;
}

/**
 * Calculate individual employee payroll item for a pay cycle
 */
export function calculateEmployeePayroll(
  employee: Employee,
  attendance: EmployeeAttendanceData,
  salaryStructure?: SalaryStructure,
  customConfig?: StatutoryRulesConfig
): Omit<PayrollItem, "id" | "payrollRunId" | "organizationId" | "status"> {
  const statConfig =
    customConfig || salaryStructure?.statutoryConfig || DEFAULT_STATUTORY_CONFIG;

  const monthlyCtc = employee.currentMonthlyGross || employee.currentAnnualCtc / 12 || 50000;

  // Basic Salary (typically 40% - 50% of CTC)
  const basicPercent = salaryStructure?.basicSalaryPercent || 50;
  const basicSalary = Math.round((monthlyCtc * basicPercent) / 100);

  // House Rent Allowance (HRA) (typically 40% - 50% of Basic)
  const hraPercent = salaryStructure?.hraPercent || 40;
  const hra = Math.round((basicSalary * hraPercent) / 100);

  // Fixed allowances
  const conveyanceAllowance = salaryStructure?.conveyanceAllowance || 1600;
  const medicalAllowance = salaryStructure?.medicalAllowance || 1250;

  // Special Allowance (balancing component)
  const currentAssigned = basicSalary + hra + conveyanceAllowance + medicalAllowance;
  const specialAllowance = Math.max(0, Math.round(monthlyCtc - currentAssigned));

  // Additional earnings for this month
  const performanceBonus = attendance.bonusAmount || 0;
  const hourlyRate = (monthlyCtc / (attendance.workingDays * 8)) || 250;
  const overtimePay = Math.round(attendance.overtimeHours * hourlyRate * 1.5);
  const otherEarnings = 0;

  // Total Gross Salary for the cycle
  const grossSalary =
    basicSalary +
    hra +
    conveyanceAllowance +
    medicalAllowance +
    specialAllowance +
    performanceBonus +
    overtimePay +
    otherEarnings;

  // Loss of Pay (LOP) deduction
  const perDayRate = attendance.workingDays > 0 ? monthlyCtc / attendance.workingDays : 0;
  const lossOfPayDeduction = Math.round(attendance.lossOfPayDays * perDayRate);

  // Employee Provident Fund (PF) calculation
  let providentFund = 0;
  let employerPf = 0;
  if (statConfig.pfEnabled) {
    const pfBase =
      statConfig.pfWageCeiling > 0
        ? Math.min(basicSalary, statConfig.pfWageCeiling)
        : basicSalary;
    providentFund = Math.round((pfBase * statConfig.pfEmployeePercent) / 100);
    employerPf = Math.round((pfBase * statConfig.pfEmployerPercent) / 100);
  }

  // Employee State Insurance (ESI) calculation (applies if Gross <= wage ceiling)
  let esi = 0;
  let employerEsi = 0;
  if (statConfig.esiEnabled && grossSalary <= statConfig.esiWageCeiling) {
    esi = Math.round((grossSalary * statConfig.esiEmployeePercent) / 100);
    employerEsi = Math.round((grossSalary * statConfig.esiEmployerPercent) / 100);
  }

  // Professional Tax (PT)
  let professionalTax = 0;
  if (statConfig.ptEnabled) {
    if (statConfig.ptSlabs && statConfig.ptSlabs.length > 0) {
      const matchedSlab = statConfig.ptSlabs.find(
        (s) => grossSalary >= s.minSalary && grossSalary <= s.maxSalary
      );
      professionalTax = matchedSlab ? matchedSlab.taxAmount : statConfig.ptMonthlyFlat;
    } else {
      professionalTax = statConfig.ptMonthlyFlat;
    }
  }

  // Income Tax (TDS) estimation
  let incomeTaxTDS = attendance.customTds !== undefined ? attendance.customTds : 0;
  if (statConfig.tdsEnabled && attendance.customTds === undefined) {
    const annualEstimatedGross = grossSalary * 12;
    // Standard Indian Tax slabs (simplified estimation for new tax regime FY 24-25/25-26)
    if (annualEstimatedGross > 1500000) {
      incomeTaxTDS = Math.round((grossSalary * 0.15));
    } else if (annualEstimatedGross > 1200000) {
      incomeTaxTDS = Math.round((grossSalary * 0.10));
    } else if (annualEstimatedGross > 900000) {
      incomeTaxTDS = Math.round((grossSalary * 0.06));
    } else if (annualEstimatedGross > 700000) {
      incomeTaxTDS = Math.round((grossSalary * 0.03));
    } else {
      incomeTaxTDS = 0;
    }
  }

  const loanDeduction = attendance.loanDeduction || 0;
  const advanceDeduction = attendance.advanceDeduction || 0;
  const otherDeductions = attendance.otherDeductions || 0;

  const totalDeductions =
    providentFund +
    esi +
    professionalTax +
    incomeTaxTDS +
    lossOfPayDeduction +
    loanDeduction +
    advanceDeduction +
    otherDeductions;

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: employee.id,
    departmentName: employee.departmentName || "General",
    designationTitle: employee.designationTitle || "Associate",
    bankAccountNumber: employee.bankDetails?.accountNumber || "",
    bankName: employee.bankDetails?.bankName || "",
    ifscCode: employee.bankDetails?.ifscCode || "",
    totalWorkingDays: attendance.workingDays,
    daysPresent: attendance.presentDays,
    daysOnLeave: attendance.leaveDays,
    daysLossOfPay: attendance.lossOfPayDays,
    overtimeHours: attendance.overtimeHours,
    basicSalary,
    hra,
    conveyanceAllowance,
    medicalAllowance,
    specialAllowance,
    performanceBonus,
    overtimePay,
    otherEarnings,
    grossSalary,
    providentFund,
    esi,
    professionalTax,
    incomeTaxTDS,
    lossOfPayDeduction,
    loanDeduction,
    advanceDeduction,
    otherDeductions,
    totalDeductions,
    employerPf,
    employerEsi,
    netSalary,
  };
}

/**
 * Generate standard formatted payslip record from payroll item
 */
export function generatePayslipFromItem(
  item: PayrollItem,
  payrollRun: PayrollRun,
  employee: Employee,
  sequenceIndex: number,
  prefix: string = "CGG-PS-"
): Payslip {
  const monthStr = String(payrollRun.month).padStart(2, "0");
  const seqStr = String(sequenceIndex).padStart(4, "0");
  const payslipNumber = `${prefix}${payrollRun.year}-${monthStr}-${seqStr}`;

  const last4 = item.bankAccountNumber ? item.bankAccountNumber.slice(-4) : "••••";
  const maskedAccountNumber = `•••• •••• ${last4}`;

  return {
    id: `ps-${payrollRun.id}-${item.employeeId}`,
    payslipNumber,
    organizationId: payrollRun.organizationId,
    payrollRunId: payrollRun.id,
    employeeId: item.employeeId,
    employeeCode: item.employeeCode,
    employeeName: item.employeeName,
    departmentName: item.departmentName,
    designationTitle: item.designationTitle,
    joiningDate: employee.joiningDate,
    panNumber: employee.panNumber || employee.bankDetails?.panNumber || item.panNumber || undefined,
    uanNumber: "100987654321",
    bankName: item.bankName || "State Bank of India",
    maskedAccountNumber,
    ifscCode: item.ifscCode || "SBIN0001234",
    month: payrollRun.month,
    year: payrollRun.year,
    periodName: payrollRun.periodName,
    payDate: payrollRun.paymentDate || new Date().toISOString().split("T")[0],
    workingDays: item.totalWorkingDays,
    presentDays: item.daysPresent,
    leaveDays: item.daysOnLeave,
    lossOfPayDays: item.daysLossOfPay,
    earnings: {
      basic: item.basicSalary,
      hra: item.hra,
      conveyance: item.conveyanceAllowance,
      medical: item.medicalAllowance,
      specialAllowance: item.specialAllowance,
      bonus: item.performanceBonus,
      overtime: item.overtimePay,
      other: item.otherEarnings,
    },
    grossSalary: item.grossSalary,
    deductions: {
      pf: item.providentFund,
      esi: item.esi,
      professionalTax: item.professionalTax,
      incomeTax: item.incomeTaxTDS,
      lossOfPay: item.lossOfPayDeduction,
      loan: item.loanDeduction,
      advance: item.advanceDeduction,
      other: item.otherDeductions,
    },
    totalDeductions: item.totalDeductions,
    employerPf: item.employerPf,
    employerEsi: item.employerEsi,
    netSalary: item.netSalary,
    netSalaryInWords: numberToWordsIndian(item.netSalary),
    status: "published",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate Next Employee ID
 * e.g., prefix "CGG-EMP-", existingCount 12 -> "CGG-EMP-0013"
 */
export function generateEmployeeId(existingCount: number, prefix: string = "CGG-EMP-"): string {
  const nextNum = existingCount + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}
