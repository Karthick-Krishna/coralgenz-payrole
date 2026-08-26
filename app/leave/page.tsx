"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { LeaveManager } from "@/components/leave/leave-manager";
import { MockDataStore } from "@/lib/store/mock-store";
import { LeaveRequest, LeaveBalance, Employee } from "@/types";

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadData = () => {
    setLeaveRequests(MockDataStore.getLeaveRequests());
    setLeaveBalances(MockDataStore.getLeaveBalances());
    setEmployees(MockDataStore.getEmployees());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="leave">
      <LeaveManager
        initialLeaveRequests={leaveRequests}
        initialBalances={leaveBalances}
        employees={employees}
      />
    </AppLayout>
  );
}
