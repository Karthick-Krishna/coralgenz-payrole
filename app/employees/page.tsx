"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeList } from "@/components/employees/employee-list";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee, Department, Designation } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const loadData = () => {
    setEmployees(MockDataStore.getEmployees());
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="employees">
      <EmployeeList
        employees={employees}
        departments={departments}
        designations={designations}
      />
    </AppLayout>
  );
}
