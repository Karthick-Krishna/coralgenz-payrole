"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequestManager } from "@/components/requests/request-manager";
import { RequestService } from "@/lib/firebase/request-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { EmployeeRequest, Employee } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

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
        <PageLogoLoader text="Loading Employee Claims & Requests..." />
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
