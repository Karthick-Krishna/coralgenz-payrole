"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { LeaveManager } from "@/components/leave/leave-manager";
import { LeaveService } from "@/lib/firebase/leave-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { LeaveRequest, LeaveBalance, Employee } from "@/types";

import { useAuth } from "@/lib/auth/auth-context";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRole, user } = useAuth();

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const empId = user?.employeeId || "";
      if (currentRole === "employee") {
        const [{ requests, balance }, emp] = await Promise.all([
          LeaveService.getLeaves(empId),
          EmployeeService.getEmployeeById(empId),
        ]);
        setLeaveRequests(requests);
        setLeaveBalances(balance ? [balance] : []);
        if (emp) setEmployees([emp]);
      } else {
        const [{ requests, balance }, emps] = await Promise.all([
          LeaveService.getLeaves(),
          EmployeeService.getEmployees(),
        ]);
        setLeaveRequests(requests);
        setLeaveBalances(balance ? [balance] : []);
        setEmployees(emps);
      }
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
        <PageLogoLoader text="Loading Leave Balances & Approval Workflows..." />
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
