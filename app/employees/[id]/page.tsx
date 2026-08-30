"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { DepartmentService } from "@/lib/firebase/department-service";
import { DesignationService } from "@/lib/firebase/designation-service";
import { Employee, Department, Designation } from "@/types";
import { Button } from "@/components/ui/button";
import { FireLogoLoader } from "@/components/ui/fire-logo-loader";

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
    const [emp, emps, depts, desigs] = await Promise.all([
      EmployeeService.getEmployeeById(id),
      EmployeeService.getEmployees(),
      DepartmentService.getDepartments(),
      DesignationService.getDesignations()
    ]);
    
    setEmployee(emp || null);
    setAllEmployees(emps);
    setDepartments(depts);
    setDesignations(desigs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStoreUpdate = () => loadData();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, [id, isEditingParam]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <FireLogoLoader
          size="md"
          message="Igniting Employee Profile..."
          subMessage="Loading salary structure, compliance, and employment records"
        />
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
        key={`edit-${employee.id}-${employee.updatedAt || ''}`}
        initialData={employee}
        departments={departments}
        designations={designations}
        allEmployees={allEmployees}
        isEditing={true}
        onSaved={async (savedEmp) => {
          if (savedEmp) {
            setEmployee(savedEmp);
          }
          await loadData();
          router.replace(`/employees/${id}`);
        }}
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
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center p-8">
            <FireLogoLoader
              size="md"
              message="Igniting Employee Records..."
              subMessage="Loading verified salary and compliance files"
            />
          </div>
        }
      >
        <EmployeeDetailContent />
      </Suspense>
    </AppLayout>
  );
}
