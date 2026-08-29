export type UserRole =
  | 'super_admin'
  | 'hr_admin'
  | 'manager'
  | 'employee';

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'intern'
  | 'temporary';

export type EmployeeStatus =
  | 'active'
  | 'on_leave'
  | 'probation'
  | 'resigned'
  | 'terminated'
  | 'retired'
  | 'inactive';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'leave'
  | 'holiday'
  | 'week_off';

export type LeaveType =
  | 'casual'
  | 'sick'
  | 'annual'
  | 'earned'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PayrollStatus =
  | 'draft'
  | 'processing'
  | 'processed'
  | 'approved'
  | 'locked'
  | 'paid';

export type PayrollFrequency = 'monthly' | 'bi_weekly' | 'weekly';

export type DocumentType =
  | 'identity_proof'
  | 'address_proof'
  | 'offer_letter'
  | 'employment_agreement'
  | 'educational_certificate'
  | 'bank_document'
  | 'resume'
  | 'other';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  employeeId?: string;
  photoURL?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  currency: string; // Default: 'INR'
  currencySymbol: string; // Default: '₹'
  financialYearStartMonth: number; // 4 for April in India
  payrollFrequency: PayrollFrequency;
  timeZone: string;
  workingDays: number[]; // [1, 2, 3, 4, 5] (Monday-Friday)
  weeklyOffDays: number[]; // [0, 6] (Sunday, Saturday)
  employeeIdPrefix: string; // Default: 'CGG-EMP-'
  payslipNumberPrefix: string; // Default: 'CGG-PS-'
  panNumber?: string;
  gstin?: string;
  pfRegistrationNumber?: string;
  esiRegistrationNumber?: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

export interface BankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType?: 'savings' | 'current' | 'salary';
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SalaryRevision {
  id: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  changedBy: string;
  changedByName: string;
  timestamp: string;
}

export interface EmployeeExitInfo {
  resignationDate: string;
  lastWorkingDay: string;
  exitReason: string;
  noticePeriodDays: number;
  exitStatus: 'pending' | 'approved' | 'settled' | 'cancelled';
  settlementAmount?: number;
  settlementNotes?: string;
  settledAt?: string;
  settledBy?: string;
}

export interface Employee {
  id: string; // CGG-EMP-0001
  userId?: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  phone: string;
  avatarUrl?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;

  // Employment Details
  joiningDate: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  managerId?: string;
  managerName?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  workLocation: string;
  probationEndDate?: string;

  // Financial & Bank
  bankDetails: BankDetails;
  salaryStructureId?: string;
  currentAnnualCtc: number;
  currentMonthlyGross: number;
  salaryRevisions: SalaryRevision[];

  // Emergency & Documents
  emergencyContact: EmergencyContact;
  documents: EmployeeDocument[];

  // Exit Information (if applicable)
  exitInfo?: EmployeeExitInfo;

  // Portal & Role
  role?: UserRole;
  portalRole?: UserRole;

  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  colorHex?: string;
  employeeCount: number;
  monthlyPayrollCost: number;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface Designation {
  id: string;
  organizationId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  description?: string;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO Timestamp or HH:mm:ss
  checkOut?: string;
  workHoursMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  isLateArrival: boolean;
  isEarlyDeparture: boolean;
  remarks?: string;
  workMode?: 'office' | 'remote' | 'hybrid';
  ipAddress?: string;
  manualOverrideBy?: string;
  manualOverrideReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  documentUrl?: string;
  managerId?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  organizationId: string;
  employeeId: string;
  year: number;
  casual: { allocated: number; used: number; remaining: number };
  sick: { allocated: number; used: number; remaining: number };
  annual: { allocated: number; used: number; remaining: number };
  earned: { allocated: number; used: number; remaining: number };
  maternity?: { allocated: number; used: number; remaining: number };
  paternity?: { allocated: number; used: number; remaining: number };
  unpaid: { used: number };
  updatedAt?: string;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'flat' | 'percentage_of_basic' | 'percentage_of_gross';
  value: number; // Flat amount or percentage
  isTaxable: boolean;
  isStatutory: boolean;
  description?: string;
}

export interface StatutoryRulesConfig {
  pfEnabled: boolean;
  pfEmployeePercent: number; // standard 12%
  pfEmployerPercent: number; // standard 12%
  pfWageCeiling: number; // 15000 in India, or unrestricted
  esiEnabled: boolean;
  esiEmployeePercent: number; // standard 0.75%
  esiEmployerPercent: number; // standard 3.25%
  esiWageCeiling: number; // 21000 in India
  ptEnabled: boolean;
  ptMonthlyFlat: number; // standard 200 (or slab-based)
  ptSlabs?: { minSalary: number; maxSalary: number; taxAmount: number }[];
  tdsEnabled: boolean;
  gratuityEnabled: boolean;
  gratuityPercent: number; // 4.81%
}

export interface SalaryStructure {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  basicSalaryPercent: number; // e.g. 40% of CTC
  hraPercent: number; // e.g. 20% of Basic
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowancePercent: number;
  statutoryConfig: StatutoryRulesConfig;
  customEarnings: SalaryComponent[];
  customDeductions: SalaryComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollItem {
  id: string;
  payrollRunId: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  designationTitle: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;

  // Attendance metrics
  totalWorkingDays: number;
  daysPresent: number;
  daysOnLeave: number;
  daysLossOfPay: number;
  overtimeHours: number;

  // Earnings Breakdown
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  performanceBonus: number;
  overtimePay: number;
  otherEarnings: number;
  grossSalary: number;

  // Deductions Breakdown
  providentFund: number;
  esi: number;
  professionalTax: number;
  incomeTaxTDS: number;
  lossOfPayDeduction: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  // Employer Contributions
  employerPf: number;
  employerEsi: number;

  // Net Pay
  netSalary: number;

  payslipId?: string;
  status: 'calculated' | 'approved' | 'paid';
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  month: number; // 1-12
  year: number; // e.g. 2026
  periodName: string; // e.g. "August 2026"
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossPayroll: number;
  totalDeductions: number;
  totalNetPayroll: number;
  totalPfContribution: number;
  totalEsiContribution: number;
  totalTdsDeduction: number;
  processedCount: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  payslipNumber: string; // CGG-PS-2026-08-0001
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationTitle: string;
  joiningDate: string;
  panNumber?: string;
  uanNumber?: string;
  bankName: string;
  maskedAccountNumber: string; // ••••••••••1234
  ifscCode: string;
  month: number;
  year: number;
  periodName: string;
  payDate: string;

  // Attendance
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  lossOfPayDays: number;

  // Earnings
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    medical: number;
    specialAllowance: number;
    bonus: number;
    overtime: number;
    other: number;
  };
  grossSalary: number;

  // Deductions
  deductions: {
    pf: number;
    esi: number;
    professionalTax: number;
    incomeTax: number;
    lossOfPay: number;
    loan: number;
    advance: number;
    other: number;
  };
  totalDeductions: number;

  // Employer Contributions
  employerPf: number;
  employerEsi: number;

  // Final Net
  netSalary: number;
  netSalaryInWords: string;

  status: 'draft' | 'published' | 'paid';
  generatedAt: string;
}

export interface Holiday {
  id: string;
  organizationId: string;
  name: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  type: 'public' | 'company' | 'optional' | 'restricted';
  isRecurringYearly: boolean;
  description?: string;
}

export interface Announcement {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: 'general' | 'holiday' | 'payroll' | 'event' | 'policy' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetDepartmentId?: string; // optional specific department
  authorId: string;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  expiresAt?: string;
  isPinned: boolean;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'leave_submitted'
    | 'leave_approved'
    | 'leave_rejected'
    | 'payroll_processed'
    | 'payroll_locked'
    | 'payslip_ready'
    | 'announcement'
    | 'attendance_reminder'
    | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'login'
    | 'logout'
    | 'create_employee'
    | 'update_employee'
    | 'delete_employee'
    | 'revise_salary'
    | 'process_payroll'
    | 'approve_payroll'
    | 'lock_payroll'
    | 'generate_payslips'
    | 'submit_leave'
    | 'approve_leave'
    | 'reject_leave'
    | 'modify_attendance'
    | 'update_settings'
    | 'create_department'
    | 'update_department'
    | 'delete_department'
    | 'create_designation'
    | 'update_designation'
    | 'delete_designation'
    | 'create_announcement'
    | 'update_salary_structure'
    | 'submit_request'
    | 'approve_request'
    | 'reject_request'
    | 'role_delegation'
    | 'create_user'
    | 'update_user'
    | 'update_password'
    | 'delete_user'
    | 'system_event';
  module:
    | 'auth'
    | 'employee'
    | 'payroll'
    | 'payslip'
    | 'leave'
    | 'attendance'
    | 'department'
    | 'designation'
    | 'settings'
    | 'announcement'
    | 'requests'
    | 'system';
  recordId?: string;
  recordTitle?: string;
  details: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  timestamp: string;
}

export type EmployeeRequestType =
  | 'expense_claim'
  | 'salary_advance'
  | 'tax_declaration'
  | 'letter_request'
  | 'attendance_regularization'
  | 'resignation';

export type RequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed';

export interface EmployeeRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId?: string;
  departmentName?: string;
  type: EmployeeRequestType;
  title: string;
  description: string;
  amount?: number;
  status: RequestStatus;
  payload?: {
    // Expense Claim
    expenseCategory?: 'travel' | 'food' | 'internet' | 'training' | 'equipment' | 'other';
    merchantName?: string;
    expenseDate?: string;
    // Salary Advance
    repaymentMonths?: number;
    monthlyInstallment?: number;
    // HR Letter
    letterType?: 'salary_certificate' | 'bonafide' | 'experience' | 'relieving' | 'address_proof';
    purpose?: string;
    // Attendance Regularization
    regularizationDate?: string;
    suggestedCheckIn?: string;
    suggestedCheckOut?: string;
    regularizationReason?: string;
    // Tax Declaration
    section80C?: number;
    section80D?: number;
    hraAnnualRent?: number;
    nps80CCD?: number;
    homeLoanInterest?: number;
  };
  attachmentName?: string;
  attachmentUrl?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComments?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

