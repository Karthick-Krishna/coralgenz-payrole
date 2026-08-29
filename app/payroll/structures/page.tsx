"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { SalaryStructureView } from "@/components/payroll/salary-structure-view";
import { DEMO_SALARY_STRUCTURE } from "@/lib/demo/demo-data";
import { SalaryStructure } from "@/types";

export default function SalaryStructuresPage() {
  const [structure, setStructure] = useState<SalaryStructure>(DEMO_SALARY_STRUCTURE);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const res = await fetch("/api/salary-structures", { cache: "no-store" });
      const data = await res.json();
      if (data?.salaryStructure) {
        setStructure(data.salaryStructure);
      }
    } catch (e) {
      console.error("Error loading salary structure:", e);
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
    <AppLayout module="payroll">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <SalaryStructureView initialStructure={structure} onRefresh={() => loadData(false)} />
      )}
    </AppLayout>
  );
}
