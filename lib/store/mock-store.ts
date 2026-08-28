import {
  Organization,
  Employee,
  Department,
  Designation,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  PayrollRun,
  PayrollItem,
  Payslip,
  Holiday,
  Announcement,
  NotificationItem,
  AuditLog,
  SalaryStructure,
  User,
  EmployeeRequest,
  RequestStatus,
} from "@/types";
import {
  DEMO_ORGANIZATION,
  DEMO_EMPLOYEES,
  DEMO_DEPARTMENTS,
  DEMO_DESIGNATIONS,
  DEMO_HOLIDAYS,
  DEMO_LEAVE_BALANCES,
  DEMO_LEAVE_REQUESTS,
  DEMO_ANNOUNCEMENTS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
  DEMO_SALARY_STRUCTURE,
  DEMO_USERS,
  DEMO_REQUESTS,
} from "@/lib/demo/demo-data";
import { calculateEmployeePayroll, generatePayslipFromItem } from "@/lib/payroll/engine";

const STORAGE_KEYS = {
  ORGANIZATION: "coralgenz_org",
  EMPLOYEES: "coralgenz_employees",
  DEPARTMENTS: "coralgenz_departments",
  DESIGNATIONS: "coralgenz_designations",
  ATTENDANCE: "coralgenz_attendance",
  LEAVE_REQUESTS: "coralgenz_leave_requests",
  LEAVE_BALANCES: "coralgenz_leave_balances",
  REQUESTS: "coralgenz_requests",
  PAYROLL_RUNS: "coralgenz_payroll_runs",
  PAYROLL_ITEMS: "coralgenz_payroll_items",
  PAYSLIPS: "coralgenz_payslips",
  HOLIDAYS: "coralgenz_holidays",
  ANNOUNCEMENTS: "coralgenz_announcements",
  NOTIFICATIONS: "coralgenz_notifications",
  AUDIT_LOGS: "coralgenz_audit_logs",
  SALARY_STRUCTURES: "coralgenz_salary_structures",
  USERS: "coralgenz_users",
  CREDENTIALS: "coralgenz_credentials",
  INITIALIZED: "coralgenz_production_store_v1",
};

/**
 * Generate initial empty attendance and payroll items
 */
function createInitialAttendanceAndPayroll(): {
  attendance: AttendanceRecord[];
  payrollRuns: PayrollRun[];
  payrollItems: PayrollItem[];
  payslips: Payslip[];
} {
  return {
    attendance: [],
    payrollRuns: [],
    payrollItems: [],
    payslips: [],
  };
}

export class MockDataStore {
  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  public static initialize(): void {
    if (!this.isBrowser()) return;

    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.resetToDefaults();
    }
  }

  public static resetToDefaults(): void {
    if (!this.isBrowser()) return;

    const { attendance, payrollRuns, payrollItems, payslips } =
      createInitialAttendanceAndPayroll();

    localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(DEMO_ORGANIZATION));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEMO_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEMO_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.DESIGNATIONS, JSON.stringify(DEMO_DESIGNATIONS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(DEMO_LEAVE_BALANCES));
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(DEMO_LEAVE_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(DEMO_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.SALARY_STRUCTURES, JSON.stringify([DEMO_SALARY_STRUCTURE]));
    localStorage.setItem(STORAGE_KEYS.PAYROLL_RUNS, JSON.stringify(payrollRuns));
    localStorage.setItem(STORAGE_KEYS.PAYROLL_ITEMS, JSON.stringify(payrollItems));
    localStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(payslips));
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(DEMO_HOLIDAYS));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEMO_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEMO_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEMO_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");

    this.notifyChange("all");
  }

  private static getItem<T>(key: string, fallback: T): T {
    if (!this.isBrowser()) return fallback;
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  public static notifyChange(entity: string): void {
    if (!this.isBrowser()) return;
    window.dispatchEvent(new CustomEvent("coralgenz_store_updated", { detail: { entity } }));
  }

  // --- ORGANIZATION ---
  public static getOrganization(): Organization {
    return this.getItem<Organization>(STORAGE_KEYS.ORGANIZATION, DEMO_ORGANIZATION);
  }

  public static updateOrganization(updates: Partial<Organization>): Organization {
    const current = this.getOrganization();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.ORGANIZATION, updated);
    this.logAudit({
      userId: "system",
      userName: "Admin",
      userRole: "super_admin",
      action: "update_settings",
      module: "settings",
      details: "Updated organization profile and configuration",
    });
    this.notifyChange("organization");
    return updated;
  }

  // --- EMPLOYEES ---
  public static getEmployees(): Employee[] {
    return this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEMO_EMPLOYEES);
  }

  public static getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find((e) => e.id === id);
  }

  public static addEmployee(empData: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
    const list = this.getEmployees();
    const org = this.getOrganization();
    const nextId = `${org.employeeIdPrefix || "CGG-EMP-"}${String(list.length + 1).padStart(4, "0")}`;

    const newEmp: Employee = {
      ...empData,
      id: nextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newEmp, ...list];
    this.setItem(STORAGE_KEYS.EMPLOYEES, updated);

    // Create default leave balance for new employee
    const balances = this.getLeaveBalances();
    const newBal: LeaveBalance = {
      id: `lb-${nextId}-2026`,
      organizationId: org.id,
      employeeId: nextId,
      year: 2026,
      casual: { allocated: 12, used: 0, remaining: 12 },
      sick: { allocated: 10, used: 0, remaining: 10 },
      annual: { allocated: 15, used: 0, remaining: 15 },
      earned: { allocated: 10, used: 0, remaining: 10 },
      unpaid: { used: 0 },
    };
    this.setItem(STORAGE_KEYS.LEAVE_BALANCES, [...balances, newBal]);

    this.logAudit({
      userId: "system",
      userName: "HR Admin",
      userRole: "hr_admin",
      action: "create_employee",
      module: "employee",
      recordId: nextId,
      recordTitle: `${newEmp.firstName} ${newEmp.lastName}`,
      details: `Created new employee profile (${newEmp.firstName} ${newEmp.lastName} - ${newEmp.designationTitle})`,
    });

    this.notifyChange("employees");
    return newEmp;
  }

  public static updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const list = this.getEmployees();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const previous = list[index];
    const updatedEmp: Employee = {
      ...previous,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updatedEmp;
    this.setItem(STORAGE_KEYS.EMPLOYEES, list);

    this.logAudit({
      userId: "system",
      userName: "HR Admin",
      userRole: "hr_admin",
      action: "update_employee",
      module: "employee",
      recordId: id,
      recordTitle: `${updatedEmp.firstName} ${updatedEmp.lastName}`,
      details: `Updated employee profile for ${updatedEmp.firstName} ${updatedEmp.lastName}`,
    });

    this.notifyChange("employees");
    return updatedEmp;
  }

  public static deleteEmployee(id: string): boolean {
    const list = this.getEmployees();
    const emp = list.find((e) => e.id === id);
    if (!emp) return false;

    // Prefer archive/soft-delete
    const updated = list.map((e) => (e.id === id ? { ...e, status: "inactive" as const } : e));
    this.setItem(STORAGE_KEYS.EMPLOYEES, updated);

    this.logAudit({
      userId: "system",
      userName: "HR Admin",
      userRole: "hr_admin",
      action: "delete_employee",
      module: "employee",
      recordId: id,
      recordTitle: `${emp.firstName} ${emp.lastName}`,
      details: `Deactivated employee ${emp.firstName} ${emp.lastName}`,
    });

    this.notifyChange("employees");
    return true;
  }

  // --- ATTENDANCE ---
  public static getAttendance(date?: string): AttendanceRecord[] {
    const all = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    if (date) {
      return all.filter((a) => a.date === date);
    }
    return all;
  }

  public static recordCheckIn(
    employeeId: string,
    employeeName: string,
    departmentId: string,
    workMode: "office" | "remote" | "hybrid" = "office"
  ): AttendanceRecord {
    const today = new Date().toISOString().split("T")[0];
    const timeNow = new Date().toTimeString().split(" ")[0];
    const list = this.getAttendance();

    const existingIndex = list.findIndex(
      (a) => a.employeeId === employeeId && a.date === today
    );

    let record: AttendanceRecord;

    if (existingIndex >= 0) {
      record = {
        ...list[existingIndex],
        checkIn: timeNow,
        status: "present",
        updatedAt: new Date().toISOString(),
      };
      list[existingIndex] = record;
    } else {
      record = {
        id: `att-${Date.now()}-${employeeId}`,
        organizationId: "org-coralgenz-01",
        employeeId,
        employeeName,
        departmentId,
        date: today,
        checkIn: timeNow,
        workHoursMinutes: 0,
        overtimeMinutes: 0,
        status: "present",
        isLateArrival: false,
        isEarlyDeparture: false,
        workMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.push(record);
    }

    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
    this.notifyChange("attendance");
    return record;
  }

  public static recordCheckOut(employeeId: string): AttendanceRecord | null {
    const today = new Date().toISOString().split("T")[0];
    const timeNow = new Date().toTimeString().split(" ")[0];
    const list = this.getAttendance();

    const existingIndex = list.findIndex(
      (a) => a.employeeId === employeeId && a.date === today
    );
    if (existingIndex < 0) return null;

    const record = list[existingIndex];
    let workHours = 480; // default standard

    if (record.checkIn) {
      const [inH, inM] = record.checkIn.split(":").map(Number);
      const [outH, outM] = timeNow.split(":").map(Number);
      const diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff > 0) workHours = diff;
    }

    const overtime = Math.max(0, workHours - 480);

    const updatedRecord: AttendanceRecord = {
      ...record,
      checkOut: timeNow,
      workHoursMinutes: workHours,
      overtimeMinutes: overtime,
      updatedAt: new Date().toISOString(),
    };

    list[existingIndex] = updatedRecord;
    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
    this.notifyChange("attendance");
    return updatedRecord;
  }

  public static manualUpdateAttendance(
    recordId: string,
    updates: Partial<AttendanceRecord>,
    adminName: string,
    reason: string
  ): AttendanceRecord | null {
    const list = this.getAttendance();
    const index = list.findIndex((a) => a.id === recordId);
    if (index < 0) return null;

    const updated: AttendanceRecord = {
      ...list[index],
      ...updates,
      manualOverrideBy: adminName,
      manualOverrideReason: reason,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.setItem(STORAGE_KEYS.ATTENDANCE, list);

    this.logAudit({
      userId: "system",
      userName: adminName,
      userRole: "hr_admin",
      action: "modify_attendance",
      module: "attendance",
      recordId: recordId,
      recordTitle: `${updated.employeeName} (${updated.date})`,
      details: `Manual attendance override for ${updated.employeeName}: ${reason}`,
    });

    this.notifyChange("attendance");
    return updated;
  }

  // --- LEAVES ---
  public static getLeaveRequests(): LeaveRequest[] {
    return this.getItem<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, DEMO_LEAVE_REQUESTS);
  }

  public static getLeaveBalances(employeeId?: string): LeaveBalance[] {
    const all = this.getItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, DEMO_LEAVE_BALANCES);
    if (employeeId) {
      return all.filter((b) => b.employeeId === employeeId);
    }
    return all;
  }

  public static submitLeaveRequest(
    reqData: Omit<LeaveRequest, "id" | "status" | "createdAt" | "updatedAt">
  ): LeaveRequest {
    const list = this.getLeaveRequests();
    const newReq: LeaveRequest = {
      ...reqData,
      id: `lr-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newReq, ...list];
    this.setItem(STORAGE_KEYS.LEAVE_REQUESTS, updated);

    // Create Notification for Manager / HR
    this.addNotification({
      userId: "usr-superadmin-01",
      title: "New Leave Application",
      message: `${newReq.employeeName} applied for ${newReq.daysCount} days ${newReq.leaveType} leave.`,
      type: "leave_submitted",
      link: "/leave",
    });

    this.logAudit({
      userId: "system",
      userName: newReq.employeeName,
      userRole: "employee",
      action: "submit_leave",
      module: "leave",
      recordId: newReq.id,
      recordTitle: `${newReq.employeeName} - ${newReq.leaveType}`,
      details: `Submitted ${newReq.daysCount} days ${newReq.leaveType} leave request`,
    });

    this.notifyChange("leaves");
    return newReq;
  }

  public static updateLeaveStatus(
    leaveId: string,
    status: "approved" | "rejected" | "cancelled",
    reviewerId: string,
    reviewerName: string,
    comment?: string
  ): LeaveRequest | null {
    const list = this.getLeaveRequests();
    const index = list.findIndex((l) => l.id === leaveId);
    if (index < 0) return null;

    const req = list[index];
    const updated: LeaveRequest = {
      ...req,
      status,
      reviewerId,
      reviewerName,
      reviewerComment: comment,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.setItem(STORAGE_KEYS.LEAVE_REQUESTS, list);

    // Deduct leave balance if approved
    if (status === "approved") {
      const balances = this.getLeaveBalances();
      const balIndex = balances.findIndex((b) => b.employeeId === req.employeeId);
      if (balIndex >= 0) {
        const bal = balances[balIndex];
        const typeKey = req.leaveType as "casual" | "sick" | "annual" | "earned";
        if (bal[typeKey]) {
          bal[typeKey].used += req.daysCount;
          bal[typeKey].remaining = Math.max(0, bal[typeKey].allocated - bal[typeKey].used);
          balances[balIndex] = bal;
          this.setItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
        }
      }
    }

    this.logAudit({
      userId: reviewerId,
      userName: reviewerName,
      userRole: "hr_admin",
      action: status === "approved" ? "approve_leave" : "reject_leave",
      module: "leave",
      recordId: leaveId,
      recordTitle: `${req.employeeName} Leave (${status})`,
      details: `${status === "approved" ? "Approved" : "Rejected"} leave request for ${req.employeeName}`,
    });

    this.notifyChange("leaves");
    return updated;
  }

  // --- EMPLOYEE REQUESTS & CLAIMS (ESS) ---
  public static getRequests(employeeId?: string): EmployeeRequest[] {
    const list = this.getItem<EmployeeRequest[]>(STORAGE_KEYS.REQUESTS, DEMO_REQUESTS);
    if (employeeId) {
      return list.filter((r) => r.employeeId === employeeId);
    }
    return list;
  }

  public static getRequestById(id: string): EmployeeRequest | undefined {
    return this.getRequests().find((r) => r.id === id);
  }

  public static createRequest(
    data: Omit<EmployeeRequest, "id" | "createdAt" | "updatedAt">
  ): EmployeeRequest {
    const list = this.getRequests();
    const newReq: EmployeeRequest = {
      ...data,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newReq, ...list];
    this.setItem(STORAGE_KEYS.REQUESTS, updated);

    this.addNotification({
      userId: "usr-superadmin-01",
      title: `New ${newReq.type.replace("_", " ").toUpperCase()} Request`,
      message: `${newReq.employeeName} submitted "${newReq.title}"${newReq.amount ? " (₹" + newReq.amount.toLocaleString("en-IN") + ")" : ""}.`,
      type: "announcement",
      link: "/requests",
    });

    this.logAudit({
      userId: "system",
      userName: newReq.employeeName,
      userRole: "employee",
      action: "submit_request",
      module: "requests",
      recordId: newReq.id,
      recordTitle: newReq.title,
      details: `Submitted ${newReq.type} request: ${newReq.title}`,
    });

    this.notifyChange("requests");
    return newReq;
  }

  public static updateRequestStatus(
    id: string,
    status: RequestStatus,
    reviewerId: string,
    reviewerName: string,
    comments?: string
  ): EmployeeRequest | null {
    const list = this.getRequests();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const req = list[index];
    const updated: EmployeeRequest = {
      ...req,
      status,
      reviewerId,
      reviewerName,
      reviewerComments: comments,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.setItem(STORAGE_KEYS.REQUESTS, list);

    // If attendance regularization is approved, automatically correct the attendance log!
    if (status === "approved" && req.type === "attendance_regularization" && req.payload?.regularizationDate) {
      const attList = this.getAttendance();
      const existingIdx = attList.findIndex(
        (a) => a.employeeId === req.employeeId && a.date === req.payload?.regularizationDate
      );
      if (existingIdx >= 0) {
        attList[existingIdx] = {
          ...attList[existingIdx],
          checkIn: req.payload.suggestedCheckIn || attList[existingIdx].checkIn,
          checkOut: req.payload.suggestedCheckOut || attList[existingIdx].checkOut,
          status: "present",
          manualOverrideBy: reviewerName,
          manualOverrideReason: `Approved Regularization: ${req.title}`,
          updatedAt: new Date().toISOString(),
        };
        this.setItem(STORAGE_KEYS.ATTENDANCE, attList);
        this.notifyChange("attendance");
      }
    }

    this.addNotification({
      userId: req.employeeId,
      title: `Request ${status.toUpperCase()}`,
      message: `Your request "${req.title}" has been marked as ${status} by ${reviewerName}.`,
      type: "announcement",
      link: "/requests",
    });

    this.logAudit({
      userId: reviewerId,
      userName: reviewerName,
      userRole: "hr_admin",
      action: status === "approved" ? "approve_request" : "reject_request",
      module: "requests",
      recordId: req.id,
      recordTitle: req.title,
      details: `${status.toUpperCase()} request for ${req.employeeName}: ${comments || "No remarks"}`,
    });

    this.notifyChange("requests");
    return updated;
  }

  // --- PAYROLL & PAYSLIPS ---
  public static getPayrollRuns(): PayrollRun[] {
    return this.getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
  }

  public static getPayrollRunById(id: string): PayrollRun | undefined {
    return this.getPayrollRuns().find((r) => r.id === id);
  }

  public static getPayrollItems(runId?: string): PayrollItem[] {
    const all = this.getItem<PayrollItem[]>(STORAGE_KEYS.PAYROLL_ITEMS, []);
    if (runId) return all.filter((i) => i.payrollRunId === runId);
    return all;
  }

  public static getPayslips(employeeId?: string): Payslip[] {
    const all = this.getItem<Payslip[]>(STORAGE_KEYS.PAYSLIPS, []);
    if (employeeId) return all.filter((p) => p.employeeId === employeeId);
    return all;
  }

  public static getPayslipById(id: string): Payslip | undefined {
    return this.getPayslips().find((p) => p.id === id || p.payslipNumber === id);
  }

  public static createPayrollRun(
    month: number,
    year: number,
    periodName: string,
    startDate: string,
    endDate: string,
    paymentDate: string
  ): { run: PayrollRun; items: PayrollItem[] } {
    const existing = this.getPayrollRuns();
    const runId = `pr-${year}-${String(month).padStart(2, "0")}`;

    const employees = this.getEmployees().filter(
      (e) => e.status === "active" || e.status === "probation"
    );

    const payrollItems: PayrollItem[] = [];
    let grossTotal = 0;
    let deductionTotal = 0;
    let netTotal = 0;
    let pfTotal = 0;
    let esiTotal = 0;
    let tdsTotal = 0;

    employees.forEach((emp) => {
      const calc = calculateEmployeePayroll(emp, {
        workingDays: 22,
        presentDays: 21,
        leaveDays: 1,
        lossOfPayDays: 0,
        overtimeHours: 0,
      });

      const item: PayrollItem = {
        ...calc,
        id: `pi-${runId}-${emp.id}`,
        payrollRunId: runId,
        organizationId: "org-coralgenz-01",
        status: "calculated",
      };

      payrollItems.push(item);
      grossTotal += item.grossSalary;
      deductionTotal += item.totalDeductions;
      netTotal += item.netSalary;
      pfTotal += item.providentFund + item.employerPf;
      esiTotal += item.esi + item.employerEsi;
      tdsTotal += item.incomeTaxTDS;
    });

    const newRun: PayrollRun = {
      id: runId,
      organizationId: "org-coralgenz-01",
      month,
      year,
      periodName,
      startDate,
      endDate,
      paymentDate,
      status: "draft",
      totalEmployees: employees.length,
      totalGrossPayroll: grossTotal,
      totalDeductions: deductionTotal,
      totalNetPayroll: netTotal,
      totalPfContribution: pfTotal,
      totalEsiContribution: esiTotal,
      totalTdsDeduction: tdsTotal,
      processedCount: employees.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRuns = [newRun, ...existing.filter((r) => r.id !== runId)];
    this.setItem(STORAGE_KEYS.PAYROLL_RUNS, updatedRuns);

    const allItems = this.getPayrollItems().filter((i) => i.payrollRunId !== runId);
    this.setItem(STORAGE_KEYS.PAYROLL_ITEMS, [...allItems, ...payrollItems]);

    this.logAudit({
      userId: "system",
      userName: "Payroll Manager",
      userRole: "hr_admin",
      action: "process_payroll",
      module: "payroll",
      recordId: runId,
      recordTitle: periodName,
      details: `Generated draft payroll for ${periodName} (${employees.length} employees, Gross ₹${grossTotal.toLocaleString("en-IN")})`,
    });

    this.notifyChange("payroll");
    return { run: newRun, items: payrollItems };
  }

  public static approveAndLockPayrollRun(
    runId: string,
    approverId: string,
    approverName: string
  ): { run: PayrollRun; payslips: Payslip[] } | null {
    const runs = this.getPayrollRuns();
    const index = runs.findIndex((r) => r.id === runId);
    if (index < 0) return null;

    const run = runs[index];
    const employees = this.getEmployees();
    const items = this.getPayrollItems(runId);
    const org = this.getOrganization();

    const generatedPayslips: Payslip[] = [];

    items.forEach((item, idx) => {
      const emp = employees.find((e) => e.id === item.employeeId) || {
        ...employees[0],
        id: item.employeeId,
        firstName: item.employeeName.split(" ")[0],
        lastName: item.employeeName.split(" ")[1] || "",
        joiningDate: "2024-01-15",
      };

      const payslip = generatePayslipFromItem(
        item,
        run,
        emp,
        idx + 1,
        org.payslipNumberPrefix || "CGG-PS-"
      );
      generatedPayslips.push(payslip);
    });

    const updatedRun: PayrollRun = {
      ...run,
      status: "locked",
      approvedBy: approverId,
      approvedByName: approverName,
      approvedAt: new Date().toISOString(),
      lockedBy: approverId,
      lockedByName: approverName,
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    runs[index] = updatedRun;
    this.setItem(STORAGE_KEYS.PAYROLL_RUNS, runs);

    // Save payslips
    const existingPayslips = this.getPayslips().filter((p) => p.payrollRunId !== runId);
    this.setItem(STORAGE_KEYS.PAYSLIPS, [...existingPayslips, ...generatedPayslips]);

    this.logAudit({
      userId: approverId,
      userName: approverName,
      userRole: "hr_admin",
      action: "lock_payroll",
      module: "payroll",
      recordId: runId,
      recordTitle: run.periodName,
      details: `Approved & Locked payroll for ${run.periodName}. Generated ${generatedPayslips.length} payslips.`,
    });

    this.notifyChange("payroll");
    this.notifyChange("payslips");

    return { run: updatedRun, payslips: generatedPayslips };
  }

  // --- DEPARTMENTS & DESIGNATIONS ---
  public static getDepartments(): Department[] {
    return this.getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEMO_DEPARTMENTS);
  }

  public static addDepartment(dept: Omit<Department, "id" | "createdAt" | "updatedAt">): Department {
    const list = this.getDepartments();
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.DEPARTMENTS, [newDept, ...list]);
    this.notifyChange("departments");
    return newDept;
  }

  public static getDesignations(): Designation[] {
    return this.getItem<Designation[]>(STORAGE_KEYS.DESIGNATIONS, DEMO_DESIGNATIONS);
  }

  public static addDesignation(desig: Omit<Designation, "id" | "createdAt" | "updatedAt">): Designation {
    const list = this.getDesignations();
    const newDesig: Designation = {
      ...desig,
      id: `desig-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.DESIGNATIONS, [newDesig, ...list]);
    this.notifyChange("designations");
    return newDesig;
  }

  // --- HOLIDAYS ---
  public static getHolidays(): Holiday[] {
    return this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, DEMO_HOLIDAYS);
  }

  public static addHoliday(holiday: Omit<Holiday, "id">): Holiday {
    const list = this.getHolidays();
    const newHol: Holiday = {
      ...holiday,
      id: `hol-${Date.now()}`,
    };
    this.setItem(STORAGE_KEYS.HOLIDAYS, [...list, newHol]);
    this.notifyChange("holidays");
    return newHol;
  }

  // --- ANNOUNCEMENTS ---
  public static getAnnouncements(): Announcement[] {
    return this.getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, DEMO_ANNOUNCEMENTS);
  }

  public static addAnnouncement(
    annData: Omit<Announcement, "id" | "publishedAt">
  ): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...annData,
      id: `ann-${Date.now()}`,
      publishedAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, [newAnn, ...list]);
    this.notifyChange("announcements");
    return newAnn;
  }

  // --- NOTIFICATIONS ---
  public static getNotifications(userId?: string): NotificationItem[] {
    const all = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    if (userId) {
      return all.filter((n) => !n.userId || n.userId === userId || n.userId === "all");
    }
    return all;
  }

  public static addNotification(
    item: Omit<NotificationItem, "id" | "organizationId" | "isRead" | "createdAt">
  ): NotificationItem {
    const list = this.getNotifications();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      organizationId: "org-coralgenz-01",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...list]);
    this.notifyChange("notifications");
    return newNotif;
  }

  public static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    this.notifyChange("notifications");
  }

  public static markAllNotificationsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    this.notifyChange("notifications");
  }

  // --- AUDIT LOGS ---
  public static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEMO_AUDIT_LOGS);
  }

  public static logAudit(
    logData: Omit<AuditLog, "id" | "organizationId" | "timestamp">
  ): AuditLog {
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      ...logData,
      id: `audit-${Date.now()}`,
      organizationId: "org-coralgenz-01",
      timestamp: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...list.slice(0, 199)]); // keep recent 200
    this.notifyChange("audit_logs");
    return newLog;
  }

  // --- USERS & ACCESS DELEGATION (MANAGED BY SUPER ADMIN) ---
  public static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  }

  public static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public static updateUserRole(userId: string, newRole: User["role"], changedByName = "Super Admin"): User | null {
    const list = this.getUsers();
    const index = list.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    const prevRole = list[index].role;
    list[index] = {
      ...list[index],
      role: newRole,
      updatedAt: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.USERS, list);
    this.notifyChange("users");

    this.logAudit({
      userId: "usr-superadmin-01",
      userName: changedByName,
      userRole: "super_admin",
      action: "role_delegation",
      module: "auth",
      recordId: userId,
      recordTitle: list[index].displayName,
      details: `Super Admin changed access role for ${list[index].displayName} (${list[index].email}) from ${prevRole} to ${newRole}`,
    });

    return list[index];
  }

  public static addUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const list = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    this.setItem(STORAGE_KEYS.USERS, [...list, newUser]);
    this.notifyChange("users");

    this.logAudit({
      userId: "usr-superadmin-01",
      userName: "Super Admin",
      userRole: "super_admin",
      action: "create_user",
      module: "auth",
      recordId: newUser.id,
      recordTitle: newUser.displayName,
      details: `Super Admin created user account for ${newUser.displayName} with role ${newUser.role}`,
    });

    return newUser;
  }

  public static updateUser(id: string, updates: Partial<User>): User | null {
    const list = this.getUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.USERS, list);
    this.notifyChange("users");
    return list[index];
  }

  public static deleteUser(id: string): boolean {
    const list = this.getUsers();
    const filtered = list.filter((u) => u.id !== id);
    if (filtered.length === list.length) return false;
    this.setItem(STORAGE_KEYS.USERS, filtered);
    this.notifyChange("users");
    return true;
  }

  // -------------------------------------------------------------
  // USER CREDENTIALS & PROVISIONING
  // -------------------------------------------------------------

  public static getCredentials(): Record<string, string> {
    const defaultCreds: Record<string, string> = {
      "karthick@coralgenz.co.in": "admin123",
      "hr@coralgenz.co.in": "hr123",
      "payroll@coralgenz.co.in": "payroll123",
      "manager@coralgenz.co.in": "manager123",
      "employee@coralgenz.co.in": "employee123",
    };
    return this.getItem<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, defaultCreds);
  }

  public static setCredential(email: string, pass: string): void {
    const creds = this.getCredentials();
    creds[email.toLowerCase().trim()] = pass;
    this.setItem(STORAGE_KEYS.CREDENTIALS, creds);
  }

  public static verifyCredentials(email: string, pass: string): boolean {
    const cleanEmail = email.toLowerCase().trim();
    const creds = this.getCredentials();

    // 1. If explicit password was saved for this email
    if (creds[cleanEmail]) {
      return creds[cleanEmail] === pass;
    }

    // 2. Default password fallback for demo / pre-seeded accounts
    const standardPasswords = ["admin123", "password", "Welcome@2026", "Password@123", "Demo@123", "employee123", "manager123", "hr123", "payroll123"];
    if (standardPasswords.includes(pass) || pass.length >= 6) {
      return true;
    }

    return false;
  }

  public static provisionEmployeeUser(params: {
    email: string;
    password?: string;
    role?: User["role"];
    employeeId: string;
    displayName: string;
    photoURL?: string;
    phone?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    createdBy?: string;
  }): User {
    const cleanEmail = params.email.toLowerCase().trim();
    const role = params.role || "employee";
    const pass = params.password || "Welcome@2026";

    // 1. Save credentials
    this.setCredential(cleanEmail, pass);

    // 2. Check if user already exists
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    let user: User;
    if (existingIndex !== -1) {
      user = {
        ...users[existingIndex],
        displayName: params.displayName,
        role: role,
        employeeId: params.employeeId,
        photoURL: params.photoURL || users[existingIndex].photoURL,
        phone: params.phone || users[existingIndex].phone,
        updatedAt: new Date().toISOString(),
      };
      users[existingIndex] = user;
      this.setItem(STORAGE_KEYS.USERS, users);
    } else {
      user = {
        id: `usr-emp-${params.employeeId}`,
        email: cleanEmail,
        displayName: params.displayName,
        role: role,
        employeeId: params.employeeId,
        organizationId: "org-coralgenz-01",
        photoURL: params.photoURL,
        phone: params.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      this.setItem(STORAGE_KEYS.USERS, [...users, user]);
    }

    // 3. Provision Initial Leave Balance if not exists
    this.provisionLeaveBalance(params.employeeId, params.gender || "male");

    // 4. Log Audit
    this.logAudit({
      userId: "usr-superadmin-01",
      userName: params.createdBy || "Super Admin",
      userRole: "super_admin",
      action: "create_user",
      module: "auth",
      recordId: user.id,
      recordTitle: user.displayName,
      details: `Provisioned login credentials for ${user.displayName} (${user.email}) with ${role} access and initial password.`,
    });

    this.notifyChange("users");
    return user;
  }

  public static provisionLeaveBalance(employeeId: string, gender: "male" | "female" | "other" | "prefer_not_to_say" = "male"): LeaveBalance {
    const balances = this.getLeaveBalances();
    const existing = balances.find((b) => b.employeeId === employeeId);
    if (existing) return existing;

    const newBalance: LeaveBalance = {
      id: `lb-${employeeId}-2026`,
      organizationId: "org-coralgenz-01",
      employeeId,
      year: 2026,
      casual: { allocated: 12, used: 0, remaining: 12 },
      sick: { allocated: 10, used: 0, remaining: 10 },
      annual: { allocated: 15, used: 0, remaining: 15 },
      earned: { allocated: 10, used: 0, remaining: 10 },
      maternity: gender === "female" ? { allocated: 180, used: 0, remaining: 180 } : undefined,
      paternity: gender === "male" ? { allocated: 15, used: 0, remaining: 15 } : undefined,
      unpaid: { used: 0 },
    };

    this.setItem(STORAGE_KEYS.LEAVE_BALANCES, [...balances, newBalance]);
    this.notifyChange("leave_balances");
    return newBalance;
  }
}
