"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DepartmentManager } from "@/components/departments/department-manager";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Department, Employee } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [deptRes, empList] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }).then((r) => r.json()),
        EmployeeService.getEmployees(),
      ]);
      if (deptRes?.departments) {
        setDepartments(deptRes.departments);
      }
      setEmployees(empList);
    } catch (e) {
      console.error("Error loading departments:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleUpdate);
  }, []);

  return (
    <AppLayout module="departments">
      {isLoading ? (
        <PageLogoLoader text="Loading Corporate Departments & Budget Allocations..." />
      ) : (
        <DepartmentManager
          initialDepartments={departments}
          employees={employees}
          onRefresh={() => loadData(false)}
        />
      )}
    </AppLayout>
  );
}
