"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PayrollProcessWizard } from "@/components/payroll/payroll-process-wizard";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee } from "@/types";
import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function PayrollProcessPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      const data = await EmployeeService.getEmployees();
      setEmployees(data);
      setIsLoading(false);
    };
    loadEmployees();
  }, []);

  return (
    <AppLayout module="payroll">
      {isLoading ? (
        <PageLogoLoader text="Initializing Payroll Calculation Engine & Pre-checking PF/ESI Compliance..." />
      ) : (
        <PayrollProcessWizard employees={employees} />
      )}
    </AppLayout>
  );
}
