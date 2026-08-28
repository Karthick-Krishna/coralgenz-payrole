"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequestManager } from "@/components/requests/request-manager";
import { RequestService } from "@/lib/firebase/request-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { EmployeeRequest, Employee } from "@/types";

export default function RequestsPage() {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [reqList, emps] = await Promise.all([
        RequestService.getRequests(),
        EmployeeService.getEmployees(),
      ]);
      setRequests(reqList);
      setEmployees(emps);
    } catch (e) {
      console.error("Error loading requests:", e);
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
    <AppLayout module="requests">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <RequestManager
          initialRequests={requests}
          employees={employees}
          onRefresh={loadData}
        />
      )}
    </AppLayout>
  );
}
