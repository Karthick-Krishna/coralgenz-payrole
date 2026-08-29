import fs from 'fs';
import path from 'path';
import {
  Employee,
  User,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  EmployeeRequest,
  PayrollRun,
  PayrollItem,
  Payslip,
  AuditLog,
  Department,
  Designation,
  Announcement,
  Holiday,
  Organization,
  SalaryStructure,
  NotificationItem,
} from '@/types';
import {
  DEMO_ORGANIZATION,
  DEMO_DEPARTMENTS,
  DEMO_DESIGNATIONS,
  DEMO_HOLIDAYS,
  DEMO_SALARY_STRUCTURE,
  DEMO_ANNOUNCEMENTS,
  DEMO_NOTIFICATIONS,
} from '@/lib/demo/demo-data';

interface ServerDbSchema {
  employees: Record<string, Employee>;
  users: Record<string, User>;
  attendance: Record<string, AttendanceRecord>;
  leaveRequests: Record<string, LeaveRequest>;
  leaveBalances: Record<string, LeaveBalance>;
  requests: Record<string, EmployeeRequest>;
  payrollRuns: Record<string, PayrollRun>;
  payrollItems: Record<string, PayrollItem>;
  payslips: Record<string, Payslip>;
  auditLogs: AuditLog[];
  departments: Department[];
  designations: Designation[];
  announcements: Announcement[];
  holidays: Holiday[];
  organization: Organization;
  salaryStructure: SalaryStructure;
  notifications: NotificationItem[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'server-db.json');

class ServerDb {
  private data: ServerDbSchema;

  constructor() {
    this.data = this.loadInitialData();
  }

  private getDefaultState(): ServerDbSchema {
    return {
      employees: {},
      users: {
        'usr-superadmin-01': {
          id: 'usr-superadmin-01',
          email: 'karthick@coralgenz.co.in',
          displayName: 'Karthick Krishna',
          role: 'super_admin',
          organizationId: 'org-coralgenz-01',
          employeeId: 'CGG-EMP-0001',
          photoURL: '/logo.png',
          phone: '+91 98422 43210',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2026-08-26T00:00:00.000Z',
          isActive: true,
        },
      },
      attendance: {},
      leaveRequests: {},
      leaveBalances: {},
      requests: {},
      payrollRuns: {},
      payrollItems: {},
      payslips: {},
      auditLogs: [],
      departments: DEMO_DEPARTMENTS,
      designations: DEMO_DESIGNATIONS,
      announcements: DEMO_ANNOUNCEMENTS,
      holidays: DEMO_HOLIDAYS,
      organization: DEMO_ORGANIZATION,
      salaryStructure: DEMO_SALARY_STRUCTURE,
      notifications: DEMO_NOTIFICATIONS,
    };
  }

  private loadInitialData(): ServerDbSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...this.getDefaultState(),
          ...parsed,
          employees: parsed.employees || {},
          users: parsed.users || {},
          attendance: parsed.attendance || {},
          leaveRequests: parsed.leaveRequests || {},
          leaveBalances: parsed.leaveBalances || {},
          requests: parsed.requests || {},
          payrollRuns: parsed.payrollRuns || {},
          payrollItems: parsed.payrollItems || {},
          payslips: parsed.payslips || {},
          auditLogs: parsed.auditLogs || [],
          departments: parsed.departments || DEMO_DEPARTMENTS,
          designations: parsed.designations || DEMO_DESIGNATIONS,
          announcements: parsed.announcements || DEMO_ANNOUNCEMENTS,
          holidays: parsed.holidays || DEMO_HOLIDAYS,
          organization: parsed.organization || DEMO_ORGANIZATION,
          salaryStructure: parsed.salaryStructure || DEMO_SALARY_STRUCTURE,
          notifications: parsed.notifications || DEMO_NOTIFICATIONS,
        };
      }
    } catch (err) {
      console.warn('ServerDb load notice, initializing clean state:', err);
    }

    const state = this.getDefaultState();
    this.saveStateToDisk(state);
    return state;
  }

  private saveStateToDisk(state?: ServerDbSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const dataToSave = state || this.data;
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('ServerDb save error:', err);
    }
  }

  // --- EMPLOYEES ---
  public getEmployees(): Employee[] {
    const list = Object.values(this.data.employees).filter((e) => e.status !== 'inactive');
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  public getAllEmployees(): Employee[] {
    return Object.values(this.data.employees);
  }

  public getEmployeeById(id: string): Employee | null {
    if (!id) return null;
    return this.data.employees[id] || null;
  }

  public getEmployeeByEmail(email: string): Employee | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    for (const emp of Object.values(this.data.employees)) {
      if (emp.email?.toLowerCase().trim() === clean) {
        return emp;
      }
    }
    return null;
  }

  public saveEmployee(emp: Employee): Employee {
    const now = new Date().toISOString();
    const cleanEmp: Employee = {
      ...emp,
      createdAt: emp.createdAt || now,
      updatedAt: now,
    };
    this.data.employees[emp.id] = cleanEmp;

    // Synchronize corresponding user profile
    const userId = `usr-${emp.id.toLowerCase()}`;
    const userRole = emp.portalRole || emp.role || 'employee';
    this.data.users[userId] = {
      id: userId,
      email: emp.email,
      displayName: `${emp.firstName} ${emp.lastName}`.trim(),
      role: userRole,
      employeeId: emp.id,
      organizationId: emp.organizationId || 'org-coralgenz-01',
      photoURL: emp.avatarUrl || undefined,
      phone: emp.phone || undefined,
      createdAt: emp.createdAt || now,
      updatedAt: now,
      isActive: emp.status !== 'inactive',
    };

    // Auto-create Leave Balance if missing
    const lbId = `lb-${emp.id}-2026`;
    if (!this.data.leaveBalances[lbId]) {
      this.data.leaveBalances[lbId] = {
        id: lbId,
        organizationId: emp.organizationId || 'org-coralgenz-01',
        employeeId: emp.id,
        year: 2026,
        casual: { allocated: 12, used: 0, remaining: 12 },
        sick: { allocated: 12, used: 0, remaining: 12 },
        annual: { allocated: 15, used: 0, remaining: 15 },
        earned: { allocated: 10, used: 0, remaining: 10 },
        unpaid: { used: 0 },
        updatedAt: now,
      };
    }

    this.saveStateToDisk();
    return cleanEmp;
  }

  public deleteEmployee(id: string): boolean {
    if (this.data.employees[id]) {
      delete this.data.employees[id];
      delete this.data.users[`usr-${id.toLowerCase()}`];
      delete this.data.users[id];
      delete this.data.leaveBalances[`lb-${id}-2026`];
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return Object.values(this.data.users);
  }

  public getUser(id: string): User | null {
    if (!id) return null;
    if (this.data.users[id]) return this.data.users[id];
    for (const u of Object.values(this.data.users)) {
      if (u.id === id || u.employeeId === id) return u;
    }
    return null;
  }

  public getUserById(id: string): User | null {
    return this.getUser(id);
  }

  public getUserByEmail(email: string): User | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    for (const u of Object.values(this.data.users)) {
      if (u.email?.toLowerCase().trim() === clean) {
        return u;
      }
    }
    return null;
  }

  public saveUser(user: User): User {
    this.data.users[user.id] = { ...user, updatedAt: new Date().toISOString() };
    this.saveStateToDisk();
    return this.data.users[user.id];
  }

  public deleteUser(userId: string): boolean {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- ATTENDANCE ---
  public getAttendance(employeeId?: string): AttendanceRecord[] {
    let list = Object.values(this.data.attendance);
    if (employeeId) {
      list = list.filter((a) => a.employeeId === employeeId);
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  public saveAttendance(record: AttendanceRecord): AttendanceRecord {
    const id = record.id || `att-${record.employeeId}-${record.date}`;
    const cleanRec: AttendanceRecord = {
      ...record,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.data.attendance[id] = cleanRec;
    this.saveStateToDisk();
    return cleanRec;
  }

  // --- LEAVE ---
  public getLeaveRequests(employeeId?: string): LeaveRequest[] {
    let list = Object.values(this.data.leaveRequests);
    if (employeeId) {
      list = list.filter((l) => l.employeeId === employeeId);
    }
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  public saveLeaveRequest(req: LeaveRequest): LeaveRequest {
    const id = req.id || `leave-${Date.now()}`;
    const cleanReq: LeaveRequest = {
      ...req,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.data.leaveRequests[id] = cleanReq;
    this.saveStateToDisk();
    return cleanReq;
  }

  public getLeaveBalance(employeeId: string, year = 2026): LeaveBalance {
    const id = `lb-${employeeId}-${year}`;
    if (!this.data.leaveBalances[id]) {
      this.data.leaveBalances[id] = {
        id,
        organizationId: 'org-coralgenz-01',
        employeeId,
        year,
        casual: { allocated: 12, used: 0, remaining: 12 },
        sick: { allocated: 12, used: 0, remaining: 12 },
        annual: { allocated: 15, used: 0, remaining: 15 },
        earned: { allocated: 10, used: 0, remaining: 10 },
        unpaid: { used: 0 },
        updatedAt: new Date().toISOString(),
      };
      this.saveStateToDisk();
    }
    return this.data.leaveBalances[id];
  }

  public saveLeaveBalance(balance: LeaveBalance): LeaveBalance {
    this.data.leaveBalances[balance.id] = { ...balance, updatedAt: new Date().toISOString() };
    this.saveStateToDisk();
    return this.data.leaveBalances[balance.id];
  }

  // --- REQUESTS ---
  public getRequests(employeeId?: string): EmployeeRequest[] {
    let list = Object.values(this.data.requests);
    if (employeeId) {
      list = list.filter((r) => r.employeeId === employeeId);
    }
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  public saveRequest(req: EmployeeRequest): EmployeeRequest {
    const id = req.id || `req-${Date.now()}`;
    const cleanReq: EmployeeRequest = {
      ...req,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.data.requests[id] = cleanReq;
    this.saveStateToDisk();
    return cleanReq;
  }

  // --- PAYROLL & PAYSLIPS ---
  public getPayrollRuns(): PayrollRun[] {
    return Object.values(this.data.payrollRuns).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  public getPayrollRunById(id: string): PayrollRun | null {
    if (!id) return null;
    if (this.data.payrollRuns[id]) return this.data.payrollRuns[id];
    for (const r of Object.values(this.data.payrollRuns)) {
      if (r.id === id) return r;
    }
    return null;
  }

  public savePayrollRun(run: PayrollRun): PayrollRun {
    this.data.payrollRuns[run.id] = { ...run, updatedAt: new Date().toISOString() };
    this.saveStateToDisk();
    return this.data.payrollRuns[run.id];
  }

  public getPayrollItems(runId?: string): PayrollItem[] {
    let list = Object.values(this.data.payrollItems || {});
    if (runId) {
      list = list.filter((i) => i.payrollRunId === runId);
    }
    return list;
  }

  public savePayrollItem(item: PayrollItem): PayrollItem {
    if (!this.data.payrollItems) this.data.payrollItems = {};
    this.data.payrollItems[item.id] = { ...item };
    this.saveStateToDisk();
    return this.data.payrollItems[item.id];
  }

  public savePayrollItems(items: PayrollItem[]): void {
    if (!this.data.payrollItems) this.data.payrollItems = {};
    for (const item of items) {
      this.data.payrollItems[item.id] = { ...item };
    }
    this.saveStateToDisk();
  }

  public getPayslips(employeeId?: string): Payslip[] {
    let list = Object.values(this.data.payslips);
    if (employeeId) {
      list = list.filter((p) => p.employeeId === employeeId);
    }
    return list.sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());
  }

  public getPayslipById(id: string): Payslip | null {
    if (!id) return null;
    if (this.data.payslips[id]) return this.data.payslips[id];
    for (const p of Object.values(this.data.payslips)) {
      if (p.id === id || p.payslipNumber === id) return p;
    }
    return null;
  }

  public savePayslip(payslip: Payslip): Payslip {
    this.data.payslips[payslip.id] = { ...payslip };
    this.saveStateToDisk();
    return this.data.payslips[payslip.id];
  }

  public deletePayslip(id: string): boolean {
    if (this.data.payslips[id]) {
      delete this.data.payslips[id];
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 300) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 300);
    }
    this.saveStateToDisk();
    return log;
  }

  // --- DEPARTMENTS ---
  public getDepartments(): Department[] {
    return this.data.departments.filter((d) => !d.isArchived);
  }

  public getDepartmentById(id: string): Department | null {
    return this.data.departments.find((d) => d.id === id) || null;
  }

  public saveDepartment(dept: Partial<Department> & { name: string; code: string }): Department {
    const id = dept.id || `dept-${Date.now()}`;
    const now = new Date().toISOString();
    const existingIndex = this.data.departments.findIndex((d) => d.id === id);

    const cleanDept: Department = {
      id,
      organizationId: dept.organizationId || 'org-coralgenz-01',
      name: dept.name,
      code: dept.code.toUpperCase(),
      description: dept.description || '',
      headEmployeeId: dept.headEmployeeId,
      headEmployeeName: dept.headEmployeeName,
      colorHex: dept.colorHex || '#ff5722',
      employeeCount: dept.employeeCount || 0,
      monthlyPayrollCost: dept.monthlyPayrollCost || 0,
      createdAt: dept.createdAt || now,
      updatedAt: now,
      isArchived: Boolean(dept.isArchived),
    };

    if (existingIndex >= 0) {
      this.data.departments[existingIndex] = cleanDept;
    } else {
      this.data.departments.push(cleanDept);
    }

    this.saveStateToDisk();
    return cleanDept;
  }

  public deleteDepartment(id: string): boolean {
    const index = this.data.departments.findIndex((d) => d.id === id);
    if (index >= 0) {
      this.data.departments.splice(index, 1);
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- DESIGNATIONS ---
  public getDesignations(): Designation[] {
    return this.data.designations.filter((d) => d.status !== 'inactive');
  }

  public getDesignationById(id: string): Designation | null {
    return this.data.designations.find((d) => d.id === id) || null;
  }

  public saveDesignation(desig: Partial<Designation> & { title: string; departmentId: string }): Designation {
    const id = desig.id || `desig-${Date.now()}`;
    const now = new Date().toISOString();
    const existingIndex = this.data.designations.findIndex((d) => d.id === id);

    const cleanDesig: Designation = {
      id,
      organizationId: desig.organizationId || 'org-coralgenz-01',
      title: desig.title,
      departmentId: desig.departmentId,
      departmentName: desig.departmentName || 'General',
      description: desig.description || '',
      minSalary: Number(desig.minSalary) || 40000,
      maxSalary: Number(desig.maxSalary) || 120000,
      employeeCount: desig.employeeCount || 0,
      status: desig.status || 'active',
      createdAt: desig.createdAt || now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      this.data.designations[existingIndex] = cleanDesig;
    } else {
      this.data.designations.push(cleanDesig);
    }

    this.saveStateToDisk();
    return cleanDesig;
  }

  public deleteDesignation(id: string): boolean {
    const index = this.data.designations.findIndex((d) => d.id === id);
    if (index >= 0) {
      this.data.designations.splice(index, 1);
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(): Announcement[] {
    return this.data.announcements.sort(
      (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    );
  }

  public saveAnnouncement(ann: Partial<Announcement> & { title: string; content: string }): Announcement {
    const id = ann.id || `ann-${Date.now()}`;
    const now = new Date().toISOString();
    const existingIndex = this.data.announcements.findIndex((a) => a.id === id);

    const cleanAnn: Announcement = {
      id,
      organizationId: ann.organizationId || 'org-coralgenz-01',
      title: ann.title,
      content: ann.content,
      category: ann.category || 'general',
      priority: ann.priority || 'medium',
      authorId: ann.authorId || 'usr-superadmin-01',
      authorName: ann.authorName || 'Super Admin',
      authorRole: ann.authorRole || 'SUPER ADMIN',
      publishedAt: ann.publishedAt || now,
      expiresAt: ann.expiresAt,
      isPinned: Boolean(ann.isPinned),
      targetDepartmentId: ann.targetDepartmentId,
    };

    if (existingIndex >= 0) {
      this.data.announcements[existingIndex] = cleanAnn;
    } else {
      this.data.announcements.unshift(cleanAnn);
    }

    this.saveStateToDisk();
    return cleanAnn;
  }

  public deleteAnnouncement(id: string): boolean {
    const index = this.data.announcements.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.data.announcements.splice(index, 1);
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- HOLIDAYS / CALENDAR ---
  public getHolidays(): Holiday[] {
    return this.data.holidays.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  public saveHoliday(holiday: Partial<Holiday> & { name: string; date: string }): Holiday {
    const id = holiday.id || `hol-${Date.now()}`;
    const existingIndex = this.data.holidays.findIndex((h) => h.id === id);

    const d = new Date(holiday.date);
    const dayOfWeek = holiday.dayOfWeek || d.toLocaleDateString('en-US', { weekday: 'long' });

    const cleanHoliday: Holiday = {
      id,
      organizationId: holiday.organizationId || 'org-coralgenz-01',
      name: holiday.name,
      date: holiday.date,
      dayOfWeek,
      type: holiday.type || 'public',
      description: holiday.description || '',
      isRecurringYearly: holiday.isRecurringYearly ?? true,
    };

    if (existingIndex >= 0) {
      this.data.holidays[existingIndex] = cleanHoliday;
    } else {
      this.data.holidays.push(cleanHoliday);
    }

    this.saveStateToDisk();
    return cleanHoliday;
  }

  public deleteHoliday(id: string): boolean {
    const index = this.data.holidays.findIndex((h) => h.id === id);
    if (index >= 0) {
      this.data.holidays.splice(index, 1);
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  // --- ORGANIZATION SETTINGS ---
  public getOrganization(): Organization {
    return this.data.organization || DEMO_ORGANIZATION;
  }

  public saveOrganization(org: Partial<Organization>): Organization {
    const cleanOrg: Organization = {
      ...this.data.organization,
      ...org,
      updatedAt: new Date().toISOString(),
    };
    this.data.organization = cleanOrg;
    this.saveStateToDisk();
    return cleanOrg;
  }

  // --- SALARY STRUCTURE ---
  public getSalaryStructure(): SalaryStructure {
    return this.data.salaryStructure || DEMO_SALARY_STRUCTURE;
  }

  public saveSalaryStructure(structure: SalaryStructure): SalaryStructure {
    this.data.salaryStructure = { ...structure, updatedAt: new Date().toISOString() };
    this.saveStateToDisk();
    return this.data.salaryStructure;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): NotificationItem[] {
    let list = this.data.notifications || [];
    if (userId) {
      list = list.filter((n) => !n.userId || n.userId === userId);
    }
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  public addNotification(notif: Partial<NotificationItem> & { title: string; message: string }): NotificationItem {
    const id = notif.id || `notif-${Date.now()}`;
    const cleanNotif: NotificationItem = {
      id,
      organizationId: notif.organizationId || 'org-coralgenz-01',
      userId: notif.userId || '',
      title: notif.title,
      message: notif.message,
      type: notif.type || 'system',
      isRead: Boolean(notif.isRead),
      createdAt: notif.createdAt || new Date().toISOString(),
      link: notif.link,
    };
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(cleanNotif);
    if (this.data.notifications.length > 200) {
      this.data.notifications = this.data.notifications.slice(0, 200);
    }
    this.saveStateToDisk();
    return cleanNotif;
  }

  public markAllNotificationsRead(userId?: string): void {
    if (!this.data.notifications) return;
    this.data.notifications = this.data.notifications.map((n) => {
      if (!userId || n.userId === userId || !n.userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.saveStateToDisk();
  }
}

export const serverDb = new ServerDb();
