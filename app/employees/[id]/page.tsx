"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { EmployeeForm } from "@/components/employees/employee-form";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee, Department, Designation } from "@/types";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function EmployeeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const isEditingParam = searchParams?.get("edit") === "true";

  const [employee, setEmployee] = useState<Employee | null>(() => {
    if (!id) return null;
    return MockDataStore.getEmployeeById(id) || null;
  });
  const [departments, setDepartments] = useState<Department[]>(() => MockDataStore.getDepartments());
  const [designations, setDesignations] = useState<Designation[]>(() => MockDataStore.getDesignations());
  const [allEmployees, setAllEmployees] = useState<Employee[]>(() => MockDataStore.getEmployees());

  const loadData = () => {
    if (!id) return;
    const emp = MockDataStore.getEmployeeById(id);
    setEmployee(emp || null);
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
    setAllEmployees(MockDataStore.getEmployees());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [id]);

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
