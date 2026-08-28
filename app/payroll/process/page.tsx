"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PayrollProcessWizard } from "@/components/payroll/payroll-process-wizard";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee } from "@/types";

export default function ProcessPayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const emps = await EmployeeService.getEmployees();
        setEmployees(emps);
      } catch (e) {
        console.error("Error loading employees for payroll:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, []);

  return (
    <AppLayout module="payroll">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <PayrollProcessWizard employees={employees} />
      )}
    </AppLayout>
  );
}
