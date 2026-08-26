"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PayrollProcessWizard } from "@/components/payroll/payroll-process-wizard";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee } from "@/types";

export default function ProcessPayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    setEmployees(MockDataStore.getEmployees());
  }, []);

  return (
    <AppLayout module="payroll">
      <PayrollProcessWizard employees={employees} />
    </AppLayout>
  );
}
