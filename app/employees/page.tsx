"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeList } from "@/components/employees/employee-list";
import { MockDataStore } from "@/lib/store/mock-store";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee, Department, Designation } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    // Fetch employees from Firestore
    const emps = await EmployeeService.getEmployees();
    setEmployees(emps);
    
    // Departments & Designations can remain mock/local for now unless migrated
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="employees">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          departments={departments}
          designations={designations}
        />
      )}
    </AppLayout>
  );
}
