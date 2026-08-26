"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequestManager } from "@/components/requests/request-manager";
import { MockDataStore } from "@/lib/store/mock-store";
import { EmployeeRequest, Employee } from "@/types";

export default function RequestsPage() {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadData = () => {
    setRequests(MockDataStore.getRequests());
    setEmployees(MockDataStore.getEmployees());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="requests">
      <RequestManager
        initialRequests={requests}
        employees={employees}
      />
    </AppLayout>
  );
}
