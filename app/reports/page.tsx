"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ReportViewer } from "@/components/reports/report-viewer";
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

  const loadData = () => {
    setEmployees(MockDataStore.getEmployees());
    setPayrollRuns(MockDataStore.getPayrollRuns());
    setAttendance(MockDataStore.getAttendance());
    setLeaveRequests(MockDataStore.getLeaveRequests());
    setDepartments(MockDataStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="reports">
      <ReportViewer
        employees={employees}
        payrollRuns={payrollRuns}
        attendance={attendance}
        leaveRequests={leaveRequests}
        departments={departments}
      />
    </AppLayout>
  );
}
