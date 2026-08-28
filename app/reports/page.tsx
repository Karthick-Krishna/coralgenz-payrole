"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ReportViewer } from "@/components/reports/report-viewer";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { LeaveService } from "@/lib/firebase/leave-service";
import { MockDataStore } from "@/lib/store/mock-store";
import {
  Employee,
  PayrollRun,
  AttendanceRecord,
  LeaveRequest,
  Department,
} from "@/types";

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, runs, att, leaves] = await Promise.all([
        EmployeeService.getEmployees(),
        PayrollService.getPayrollRuns(),
        AttendanceService.getAttendance(),
        LeaveService.getLeaves(),
      ]);
      setEmployees(emps);
      setPayrollRuns(runs);
      setAttendance(att);
      setLeaveRequests(leaves.requests);
      setDepartments(MockDataStore.getDepartments());
    } catch (e) {
      console.error("Error loading reports data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="reports">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <ReportViewer
          employees={employees}
          payrollRuns={payrollRuns}
          attendance={attendance}
          leaveRequests={leaveRequests}
          departments={departments}
        />
      )}
    </AppLayout>
  );
}
