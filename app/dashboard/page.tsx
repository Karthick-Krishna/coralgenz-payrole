"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { MockDataStore } from "@/lib/store/mock-store";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { LeaveService } from "@/lib/firebase/leave-service";
import { AnnouncementService } from "@/lib/firebase/announcement-service";
import { AuditService } from "@/lib/firebase/audit-service";
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
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      if (currentRole === "employee") {
        let emp: Employee | null = null;
        if (user?.employeeId) {
          emp = await EmployeeService.getEmployeeById(user.employeeId);
        }
        if (!emp && user?.email) {
          const allEmps = await EmployeeService.getEmployees();
          emp = allEmps.find((e) => e.email?.toLowerCase() === user.email?.toLowerCase()) || null;
        }

        const empId = emp?.id || user?.employeeId || "";
        const [leaves, annList, psList, att] = await Promise.all([
          LeaveService.getLeaves(empId || undefined),
          AnnouncementService.getAnnouncements(),
          PayrollService.getPayslips(empId || undefined),
          AttendanceService.getAttendance(empId || undefined)
        ]);
        
        if (emp) setEmployees([emp]);
        setLeaveRequests(leaves.requests);
        if (leaves.balance) setLeaveBalances([leaves.balance]);
        setAnnouncements(annList);
        setPayslips(psList.filter(p => !empId || p.employeeId === empId));
        setHolidays(MockDataStore.getHolidays());
        setAttendance(att);
      } else {
        const [
          emps,
          runs,
          att,
          leaves,
          annList,
          psList,
          logs,
        ] = await Promise.all([
          EmployeeService.getEmployees(),
          PayrollService.getPayrollRuns(),
          AttendanceService.getAttendance(),
          LeaveService.getLeaves(),
          AnnouncementService.getAnnouncements(),
          PayrollService.getPayslips(),
          AuditService.getLogs(),
        ]);

        setEmployees(emps);
        setPayrollRuns(runs);
        setAttendance(att);
        setLeaveRequests(leaves.requests);
        if (leaves.balance) setLeaveBalances([leaves.balance]);
        setAnnouncements(annList);
        setPayslips(psList);
        setAuditLogs(logs as any[]);
        setDepartments(MockDataStore.getDepartments());
        setHolidays(MockDataStore.getHolidays());
      }
    } catch (e) {
      console.error("Error loading dashboard server data:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleStoreUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  const currentEmployee = employees.find(
    (e) => (user?.employeeId && e.id === user.employeeId) || (user?.email && e.email?.toLowerCase() === user.email?.toLowerCase())
  );

  return (
    <AppLayout module="dashboard">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <>
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
              attendance={attendance}
              leaveRequests={leaveRequests}
              departments={departments}
              holidays={holidays}
            />
          )}


          {currentRole === "manager" && (
            <ManagerDashboard
              managerEmployee={currentEmployee}
              teamEmployees={employees.filter((e) => e.managerId === currentEmployee?.id || !e.managerId)}
              teamLeaveRequests={leaveRequests}
              attendance={attendance}
            />
          )}

          {currentRole === "employee" && (
            <EmployeeDashboard
              employee={currentEmployee}
              leaveRequests={leaveRequests.filter(
                (l) => l.employeeId === (user?.employeeId || currentEmployee?.id)
              )}
              leaveBalance={
                leaveBalances.find((b) => b.employeeId === (user?.employeeId || currentEmployee?.id)) ||
                leaveBalances[0]
              }
              latestPayslip={
                payslips.find((p) => p.employeeId === (user?.employeeId || currentEmployee?.id)) ||
                payslips[0]
              }
              announcements={announcements}
              holidays={holidays}
            />
          )}
        </>
      )}
    </AppLayout>
  );
}
