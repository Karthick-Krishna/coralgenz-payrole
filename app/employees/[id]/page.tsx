"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { EmployeeForm } from "@/components/employees/employee-form";
import { MockDataStore } from "@/lib/store/mock-store";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee, Department, Designation } from "@/types";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function EmployeeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const isEditingParam = searchParams?.get("edit") === "true";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const emp = await EmployeeService.getEmployeeById(id);
    const emps = await EmployeeService.getEmployees();
    setEmployee(emp || null);
    setAllEmployees(emps);
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
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

  if (isEditingParam) {
    return (
      <EmployeeForm
        key={`edit-${employee.id}`}
        initialData={employee}
        departments={departments}
        designations={designations}
        allEmployees={allEmployees}
        isEditing={true}
      />
    );
  }

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
