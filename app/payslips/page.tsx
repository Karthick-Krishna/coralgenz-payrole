"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PayslipList } from "@/components/payslips/payslip-list";
import { useAuth } from "@/lib/auth/auth-context";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { Payslip } from "@/types";

export default function PayslipsPage() {
  const { currentRole, user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const isEmp = currentRole === "employee";
      const targetEmpId = isEmp ? user?.employeeId : undefined;
      const data = await PayrollService.getPayslips(targetEmpId);
      setPayslips(data);
    } catch (err) {
      console.error("Error loading payslips:", err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleStoreUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, [currentRole, user?.employeeId]);

  return (
    <AppLayout module="payslips">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <PayslipList
          payslips={payslips}
          isEmployeeView={currentRole === "employee"}
        />
      )}
    </AppLayout>
  );
}
