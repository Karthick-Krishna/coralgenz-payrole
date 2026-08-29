"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { DesignationService } from "@/lib/firebase/designation-service";
import { Employee, Department, Designation } from "@/types";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function EmployeeFormContent() {
  const searchParams = useSearchParams();
  const editId = searchParams?.get("editId");

  const [initialData, setInitialData] = useState<Employee | undefined>(undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const loadData = async () => {
    const [emps, depts, desigs] = await Promise.all([
      EmployeeService.getEmployees(),
      DepartmentService.getDepartments(),
      DesignationService.getDesignations()
    ]);
    
    setDepartments(depts);
    setDesignations(desigs);
    setAllEmployees(emps);

    if (editId) {
      const emp = await EmployeeService.getEmployeeById(editId);
      if (emp) setInitialData(emp);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [editId]);

  return (
    <EmployeeForm
      key={initialData?.id || editId || "new-employee"}
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
