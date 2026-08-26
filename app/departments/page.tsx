"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DepartmentManager } from "@/components/departments/department-manager";
import { MockDataStore } from "@/lib/store/mock-store";
import { Department, Employee } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadData = () => {
    setDepartments(MockDataStore.getDepartments());
    setEmployees(MockDataStore.getEmployees());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="departments">
      <DepartmentManager
        initialDepartments={departments}
        employees={employees}
      />
    </AppLayout>
  );
}
