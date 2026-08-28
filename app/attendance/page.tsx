"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AttendanceTracker } from "@/components/attendance/attendance-tracker";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { MockDataStore } from "@/lib/store/mock-store";
import { AttendanceRecord, Employee, Department } from "@/types";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [att, emps] = await Promise.all([
        AttendanceService.getAttendance(),
        EmployeeService.getEmployees(),
      ]);
      setAttendance(att);
      setEmployees(emps);
      setDepartments(MockDataStore.getDepartments());
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
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
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
