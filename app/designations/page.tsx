"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DesignationManager } from "@/components/designations/designation-manager";
import { MockDataStore } from "@/lib/store/mock-store";
import { Designation, Department } from "@/types";

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadData = () => {
    setDesignations(MockDataStore.getDesignations());
    setDepartments(MockDataStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="designations">
      <DesignationManager
        initialDesignations={designations}
        departments={departments}
      />
    </AppLayout>
  );
}
