"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { HolidayService } from "@/lib/firebase/holiday-service";
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
        const empId = user?.employeeId;
        const [emp, leaves, annList, psList, att, holidays] = await Promise.all([
          EmployeeService.getEmployeeById(empId || ""),
          LeaveService.getLeaves(empId || undefined),
          AnnouncementService.getAnnouncements(),
          PayrollService.getPayslips(empId || undefined),
          AttendanceService.getAttendance(empId || undefined),
          HolidayService.getHolidays()
        ]);
        
        if (emp) setEmployees([emp]);
        setLeaveRequests(leaves.requests);
        if (leaves.balance) setLeaveBalances([leaves.balance]);
        setAnnouncements(annList);
        setPayslips(psList.filter(p => !empId || p.employeeId === empId));
        setHolidays(holidays);
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
          depts,
          holidays
        ] = await Promise.all([
          EmployeeService.getEmployees(),
          PayrollService.getPayrollRuns(),
          AttendanceService.getAttendance(),
          LeaveService.getLeaves(),
          AnnouncementService.getAnnouncements(),
          PayrollService.getPayslips(),
          AuditService.getLogs(),
          DepartmentService.getDepartments(),
          HolidayService.getHolidays()
        ]);

        setEmployees(emps);
        setPayrollRuns(runs);
        setAttendance(att);
        setLeaveRequests(leaves.requests);
        if (leaves.balance) setLeaveBalances([leaves.balance]);
        setAnnouncements(annList);
        setPayslips(psList);
        setAuditLogs(logs as any[]);
        setDepartments(depts);
        setHolidays(holidays);
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
