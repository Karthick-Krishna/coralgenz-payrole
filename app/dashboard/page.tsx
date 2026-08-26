"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { MockDataStore } from "@/lib/store/mock-store";
import { AppLayout } from "@/components/layout/app-layout";
import { SuperAdminDashboard } from "@/components/dashboard/super-admin-dashboard";
import { HRDashboard } from "@/components/dashboard/hr-dashboard";
import { PayrollDashboard } from "@/components/dashboard/payroll-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import {
  Employee,
  PayrollRun,
  AttendanceRecord,
  LeaveRequest,
  AuditLog,
  Department,
  Holiday,
  Announcement,
  LeaveBalance,
  Payslip,
} from "@/types";

export default function DashboardPage() {
  const { currentRole, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const loadData = () => {
    setEmployees(MockDataStore.getEmployees());
    setPayrollRuns(MockDataStore.getPayrollRuns());
    setAttendance(MockDataStore.getAttendance());
    setLeaveRequests(MockDataStore.getLeaveRequests());
    setAuditLogs(MockDataStore.getAuditLogs());
    setDepartments(MockDataStore.getDepartments());
    setHolidays(MockDataStore.getHolidays());
    setAnnouncements(MockDataStore.getAnnouncements());
    setLeaveBalances(MockDataStore.getLeaveBalances());
    setPayslips(MockDataStore.getPayslips());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  const currentEmpId = user?.employeeId || "CGG-EMP-0002";
  const currentEmployee = employees.find((e) => e.id === currentEmpId) || employees[1];
  const currentBalance = leaveBalances.find((b) => b.employeeId === currentEmpId);
  const myPayslip = payslips.find((p) => p.employeeId === currentEmpId);
  const teamEmployees = employees.filter((e) => e.managerId === currentEmpId);

  return (
    <AppLayout module="dashboard">
      {currentRole === "super_admin" && (
        <SuperAdminDashboard
          employees={employees}
          payrollRuns={payrollRuns}
          attendance={attendance}
          leaveRequests={leaveRequests}
          auditLogs={auditLogs}
          departments={departments}
        />
      )}

      {currentRole === "hr_admin" && (
        <HRDashboard
          employees={employees}
          leaveRequests={leaveRequests}
          attendance={attendance}
          departments={departments}
          holidays={holidays}
        />
      )}

      {currentRole === "payroll_manager" && (
        <PayrollDashboard
          payrollRuns={payrollRuns}
          employees={employees}
        />
      )}

      {currentRole === "manager" && (
        <ManagerDashboard
          managerEmployee={currentEmployee}
          teamEmployees={teamEmployees.length > 0 ? teamEmployees : employees.slice(0, 4)}
          teamLeaveRequests={leaveRequests}
          attendance={attendance}
        />
      )}

      {currentRole === "employee" && (
        <EmployeeDashboard
          employee={currentEmployee}
          leaveBalance={currentBalance}
          leaveRequests={leaveRequests}
          latestPayslip={myPayslip}
          announcements={announcements}
          holidays={holidays}
        />
      )}
    </AppLayout>
  );
}
