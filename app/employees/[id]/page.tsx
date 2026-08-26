"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee, Department, Designation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const loadData = () => {
    if (!id) return;
    const emp = MockDataStore.getEmployeeById(id);
    setEmployee(emp || null);
    setDepartments(MockDataStore.getDepartments());
    setDesignations(MockDataStore.getDesignations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, [id]);

  if (!employee) {
    return (
      <AppLayout module="employees">
        <div className="py-12 text-center space-y-3">
          <h3 className="text-base font-bold">Employee Not Found</h3>
          <p className="text-xs text-slate-500">
            No employee with ID &ldquo;{id}&rdquo; was found in the directory.
          </p>
          <Button variant="coral" size="sm" onClick={() => router.push("/employees")}>
            Return to Employees Directory
          </Button>
        </div>
      </AppLayout>
    );
  }

  const dept = departments.find((d) => d.id === employee.departmentId);
  const desig = designations.find((d) => d.id === employee.designationId);

  return (
    <AppLayout module="employees">
      <EmployeeProfile
        employee={employee}
        department={dept}
        designation={desig}
        onRefresh={loadData}
      />
    </AppLayout>
  );
}
