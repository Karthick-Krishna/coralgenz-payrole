"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeForm } from "@/components/employees/employee-form";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee, Department, Designation } from "@/types";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function EmployeeFormContent() {
  const searchParams = useSearchParams();
  const editId = searchParams?.get("editId");

  const [initialData, setInitialData] = useState<Employee | undefined>(undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
    const emps = MockDataStore.getEmployees();
    setAllEmployees(emps);

    if (editId) {
      const emp = MockDataStore.getEmployeeById(editId);
      if (emp) setInitialData(emp);
    }
  }, [editId]);

  return (
    <EmployeeForm
      initialData={initialData}
      departments={departments}
      designations={designations}
      allEmployees={allEmployees}
      isEditing={Boolean(editId)}
    />
  );
}

export default function NewEmployeePage() {
  return (
    <AppLayout module="employees">
      <Suspense fallback={<DashboardSkeleton />}>
        <EmployeeFormContent />
      </Suspense>
    </AppLayout>
  );
}
