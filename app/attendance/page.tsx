"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AttendanceTracker } from "@/components/attendance/attendance-tracker";
import { MockDataStore } from "@/lib/store/mock-store";
import { AttendanceRecord, Employee, Department } from "@/types";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadData = () => {
    setAttendance(MockDataStore.getAttendance());
    setEmployees(MockDataStore.getEmployees());
    setDepartments(MockDataStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="attendance">
      <AttendanceTracker
        initialAttendance={attendance}
        employees={employees}
        departments={departments}
      />
    </AppLayout>
  );
}
