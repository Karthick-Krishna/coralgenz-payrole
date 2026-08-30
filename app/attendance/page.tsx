"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AttendanceTracker } from "@/components/attendance/attendance-tracker";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { AttendanceRecord, Employee, Department } from "@/types";

import { useAuth } from "@/lib/auth/auth-context";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRole, user } = useAuth();

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const empId = user?.employeeId || "";
      if (currentRole === "employee") {
        const [att, emp] = await Promise.all([
          AttendanceService.getAttendance(empId),
          EmployeeService.getEmployeeById(empId),
        ]);
        setAttendance(att);
        if (emp) setEmployees([emp]);
      } else {
        const [att, emps] = await Promise.all([
          AttendanceService.getAttendance(),
          EmployeeService.getEmployees(),
        ]);
        setAttendance(att);
        setEmployees(emps);
      }
      const depts = await DepartmentService.getDepartments();
      setDepartments(depts);
    } catch (e) {
      console.error("Error loading attendance:", e);
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

  return (
    <AppLayout module="attendance">
      {isLoading ? (
        <PageLogoLoader text="Loading Employee Attendance Logs & Biometric Sync..." />
      ) : (
        <AttendanceTracker
          initialAttendance={attendance}
          employees={employees}
          departments={departments}
          onRefresh={loadData}
        />
      )}
    </AppLayout>
  );
}
