"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeList } from "@/components/employees/employee-list";
import { MockDataStore } from "@/lib/store/mock-store";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee, Department, Designation } from "@/types";
import { useToast } from "@/components/ui/toast";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    // Fetch employees from Firestore
    const emps = await EmployeeService.getEmployees();
    setEmployees(emps);
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
    setIsLoading(false);
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await EmployeeService.deleteEmployee(id);
      if (res) {
        success("Employee Deactivated", "Employee status has been updated to inactive in the database.");
        await loadData();
      }
    } catch (err: any) {
      toastError("Delete Failed", err?.message || "Could not deactivate employee.");
    }
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
          onDeleteEmployee={handleDeleteEmployee}
        />
      )}
    </AppLayout>
  );
}
