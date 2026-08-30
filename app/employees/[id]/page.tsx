"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { DesignationService } from "@/lib/firebase/designation-service";
import { Employee, Department, Designation } from "@/types";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { PageLogoLoader } from "@/components/ui/logo-loader";

function EmployeeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const [emp, depts, desigs] = await Promise.all([
      EmployeeService.getEmployeeById(id),
      DepartmentService.getDepartments(),
      DesignationService.getDesignations(),
    ]);
    
    setEmployee(emp || null);
    setDepartments(depts);
    setDesignations(desigs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStoreUpdate = () => loadData();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, [id]);

  if (isLoading) {
    return <PageLogoLoader text="Loading Employee Profile & Statutory Records..." />;
  }

  if (!employee) {
    return (
      <div className="py-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Employee Not Found</h3>
        <p className="text-xs text-slate-500">
          No employee with ID &ldquo;{id}&rdquo; was found in the directory.
        </p>
        <Button variant="coral" size="sm" onClick={() => router.push("/employees")}>
          Return to Employees Directory
        </Button>
      </div>
    );
  }

  const dept = departments.find((d) => d.id === employee.departmentId);
  const desig = designations.find((d) => d.id === employee.designationId);

  return (
    <EmployeeProfile
      employee={employee}
      department={dept}
      designation={desig}
      onRefresh={loadData}
    />
  );
}

export default function EmployeeDetailPage() {
  return (
    <AppLayout module="employees">
      <Suspense fallback={<DashboardSkeleton />}>
        <EmployeeDetailContent />
      </Suspense>
    </AppLayout>
  );
}
