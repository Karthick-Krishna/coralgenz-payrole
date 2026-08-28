"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { LeaveManager } from "@/components/leave/leave-manager";
import { LeaveService } from "@/lib/firebase/leave-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { LeaveRequest, LeaveBalance, Employee } from "@/types";

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [{ requests, balance }, emps] = await Promise.all([
        LeaveService.getLeaves(),
        EmployeeService.getEmployees(),
      ]);
      setLeaveRequests(requests);
      setLeaveBalances(balance ? [balance] : []);
      setEmployees(emps);
    } catch (e) {
      console.error("Error loading leave data:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleStoreUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  return (
    <AppLayout module="leave">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <LeaveManager
          initialLeaveRequests={leaveRequests}
          initialBalances={leaveBalances}
          employees={employees}
          onRefresh={loadData}
        />
      )}
    </AppLayout>
  );
}
