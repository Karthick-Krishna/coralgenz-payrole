"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DesignationManager } from "@/components/designations/designation-manager";
import { Designation, Department } from "@/types";

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [desigRes, deptRes] = await Promise.all([
        fetch("/api/designations", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/departments", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (desigRes?.designations) {
        setDesignations(desigRes.designations);
      }
      if (deptRes?.departments) {
        setDepartments(deptRes.departments);
      }
    } catch (e) {
      console.error("Error loading designations:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleUpdate);
  }, []);

  return (
    <AppLayout module="designations">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <DesignationManager
          initialDesignations={designations}
          departments={departments}
          onRefresh={() => loadData(false)}
        />
      )}
    </AppLayout>
  );
}
