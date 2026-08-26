"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PayslipList } from "@/components/payslips/payslip-list";
import { useAuth } from "@/lib/auth/auth-context";
import { MockDataStore } from "@/lib/store/mock-store";
import { Payslip } from "@/types";

export default function PayslipsPage() {
  const { currentRole, user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const loadData = () => {
    if (currentRole === "employee") {
      const myId = user?.employeeId || "CGG-EMP-0002";
      setPayslips(MockDataStore.getPayslips(myId));
    } else {
      setPayslips(MockDataStore.getPayslips());
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [currentRole, user]);

  return (
    <AppLayout module="payslips">
      <PayslipList
        payslips={payslips}
        isEmployeeView={currentRole === "employee"}
      />
    </AppLayout>
  );
}
