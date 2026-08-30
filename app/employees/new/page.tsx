"use client";

import React, { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { DesignationService } from "@/lib/firebase/designation-service";
import { Employee, Department, Designation } from "@/types";
import { PageLogoLoader } from "@/components/ui/logo-loader";

function EmployeeFormContent() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [emps, depts, desigs] = await Promise.all([
      EmployeeService.getEmployees(),
      DepartmentService.getDepartments(),
      DesignationService.getDesignations(),
    ]);
    
    setDepartments(depts);
    setDesignations(desigs);
    setAllEmployees(emps);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  if (isLoading) {
    return <PageLogoLoader text="Initializing Onboarding Wizard & Loading Department Rules..." />;
  }

  return (
    <EmployeeForm
      departments={departments}
      designations={designations}
      allEmployees={allEmployees}
      isEditing={false}
    />
  );
}

export default function NewEmployeePage() {
  return (
    <AppLayout module="employees">
      <Suspense fallback={<PageLogoLoader text="Loading Onboarding Portal..." />}>
        <EmployeeFormContent />
      </Suspense>
    </AppLayout>
  );
}
