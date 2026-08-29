import { UserRole } from "@/types";

export type Permission =
  // Employee Management
  | "employees.view"
  | "employees.view_all"
  | "employees.create"
  | "employees.edit"
  | "employees.delete"
  | "employees.export"
  | "employees.salary_view"
  | "employees.salary_edit"
  // Department & Designation
  | "departments.view"
  | "departments.manage"
  | "designations.view"
  | "designations.manage"
  // Attendance
  | "attendance.view_self"
  | "attendance.view_team"
  | "attendance.view_all"
  | "attendance.checkin_checkout"
  | "attendance.edit_manual"
  | "attendance.export"
  // Leave
  | "leave.view_self"
  | "leave.apply"
  | "leave.view_team"
  | "leave.view_all"
  | "leave.approve"
  | "leave.manage_quota"
  // Requests & Claims (ESS)
  | "requests.view_self"
  | "requests.create"
  | "requests.view_all"
  | "requests.approve"
  | "requests.reject"
  // Payroll & Salary Structures
  | "payroll.view_all"
  | "payroll.calculate"
  | "payroll.review"
  | "payroll.approve"
  | "payroll.lock"
  | "payroll.export"
  | "salary_structure.view"
  | "salary_structure.manage"
  // Payslips
  | "payslips.view_self"
  | "payslips.view_all"
  | "payslips.generate"
  | "payslips.download"
  // Reports
  | "reports.view_hr"
  | "reports.view_payroll"
  | "reports.view_team"
  | "reports.export"
  // Calendar & Announcements
  | "calendar.view"
  | "calendar.manage"
  | "announcements.view"
  | "announcements.manage"
  // Audit Logs & Settings
  | "audit_logs.view"
  | "settings.organization"
  | "settings.payroll"
  | "settings.attendance"
  | "settings.leave"
  | "settings.users"
  | "settings.security";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "employees.view",
    "employees.view_all",
    "employees.create",
    "employees.edit",
    "employees.delete",
    "employees.export",
    "employees.salary_view",
    "employees.salary_edit",
    "departments.view",
    "departments.manage",
    "designations.view",
    "designations.manage",
    "attendance.view_self",
    "attendance.view_team",
    "attendance.view_all",
    "attendance.checkin_checkout",
    "attendance.edit_manual",
    "attendance.export",
    "leave.view_self",
    "leave.apply",
    "leave.view_team",
    "leave.view_all",
    "leave.approve",
    "leave.manage_quota",
    "requests.view_self",
    "requests.create",
    "requests.view_all",
    "requests.approve",
    "requests.reject",
    "payroll.view_all",
    "payroll.calculate",
    "payroll.review",
    "payroll.approve",
    "payroll.lock",
    "payroll.export",
    "salary_structure.view",
    "salary_structure.manage",
    "payslips.view_self",
    "payslips.view_all",
    "payslips.generate",
    "payslips.download",
    "reports.view_hr",
    "reports.view_payroll",
    "reports.view_team",
    "reports.export",
    "calendar.view",
    "calendar.manage",
    "announcements.view",
    "announcements.manage",
    "audit_logs.view",
    "settings.organization",
    "settings.payroll",
    "settings.attendance",
    "settings.leave",
    "settings.users",
    "settings.security",
  ],
  hr_admin: [
    "employees.view",
    "employees.view_all",
    "employees.create",
    "employees.edit",
    "employees.delete",
    "employees.export",
    "employees.salary_view",
    "employees.salary_edit",
    "departments.view",
    "departments.manage",
    "designations.view",
    "designations.manage",
    "attendance.view_self",
    "attendance.view_team",
    "attendance.view_all",
    "attendance.checkin_checkout",
    "attendance.edit_manual",
    "attendance.export",
    "leave.view_self",
    "leave.apply",
    "leave.view_team",
    "leave.view_all",
    "leave.approve",
    "leave.manage_quota",
    "requests.view_self",
    "requests.create",
    "requests.view_all",
    "requests.approve",
    "requests.reject",
    "payroll.view_all",
    "payroll.calculate",
    "payroll.review",
    "payroll.approve",
    "payroll.lock",
    "payroll.export",
    "salary_structure.view",
    "salary_structure.manage",
    "payslips.view_self",
    "payslips.view_all",
    "payslips.generate",
    "payslips.download",
    "reports.view_hr",
    "reports.view_payroll",
    "reports.view_team",
    "reports.export",
    "calendar.view",
    "calendar.manage",
    "announcements.view",
    "announcements.manage",
    "audit_logs.view",
    "settings.organization",
    "settings.payroll",
    "settings.attendance",
    "settings.leave",
    "settings.users",
    "settings.security",
  ],
  manager: [
    "employees.view",
    "attendance.view_self",
    "attendance.view_team",
    "attendance.checkin_checkout",
    "leave.view_self",
    "leave.apply",
    "leave.view_team",
    "leave.approve",
    "requests.view_self",
    "requests.create",
    "requests.view_all",
    "requests.approve",
    "payslips.view_self",
    "payslips.download",
    "reports.view_team",
    "calendar.view",
    "announcements.view",
  ],
  employee: [
    "attendance.view_self",
    "attendance.checkin_checkout",
    "leave.view_self",
    "leave.apply",
    "requests.view_self",
    "requests.create",
    "payslips.view_self",
    "payslips.download",
    "calendar.view",
    "announcements.view",
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canAccessModule(role: UserRole | undefined, moduleName: string): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;

  switch (moduleName) {
    case "dashboard":
      return true;
    case "employees":
      return hasPermission(role, "employees.view");
    case "departments":
      return hasPermission(role, "departments.view");
    case "designations":
      return hasPermission(role, "designations.view");
    case "attendance":
      return hasPermission(role, "attendance.view_self") || hasPermission(role, "attendance.view_all");
    case "leave":
      return hasPermission(role, "leave.view_self") || hasPermission(role, "leave.view_all");
    case "requests":
      return hasPermission(role, "requests.view_self") || hasPermission(role, "requests.view_all");
    case "payroll":
      return hasPermission(role, "payroll.view_all");
    case "payslips":
      return hasPermission(role, "payslips.view_self") || hasPermission(role, "payslips.view_all");
    case "reports":
      return (
        hasPermission(role, "reports.view_hr") ||
        hasPermission(role, "reports.view_payroll") ||
        hasPermission(role, "reports.view_team")
      );
    case "calendar":
      return hasPermission(role, "calendar.view");
    case "announcements":
      return hasPermission(role, "announcements.view");
    case "audit_logs":
      return hasPermission(role, "audit_logs.view");
    case "settings":
      return (
        hasPermission(role, "settings.organization") ||
        hasPermission(role, "settings.payroll") ||
        hasPermission(role, "settings.attendance") ||
        hasPermission(role, "settings.leave") ||
        hasPermission(role, "settings.users")
      );
    default:
      return false;
  }
}
