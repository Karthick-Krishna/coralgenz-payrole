"use client";

import React, { useState, useEffect } from "react";
import { Department, Employee } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  Plus,
  Users,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface DepartmentManagerProps {
  initialDepartments: Department[];
  employees: Employee[];
  onRefresh?: () => void;
}

export function DepartmentManager({
  initialDepartments,
  employees,
  onRefresh,
}: DepartmentManagerProps) {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headEmployeeId, setHeadEmployeeId] = useState("");
  const [colorHex, setColorHex] = useState("#ff5722");

  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/departments", { cache: "no-store" });
      const data = await res.json();
      if (data?.departments) {
        setDepartments(data.departments);
      }
    } catch {}
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setDescription("");
    setHeadEmployeeId(employees[0]?.id || "");
    setColorHex("#ff5722");
    setShowModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || "");
    setHeadEmployeeId(dept.headEmployeeId || "");
    setColorHex(dept.colorHex || "#ff5722");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      error("Missing Fields", "Please enter department name and short code.");
      return;
    }

    const headEmp = employees.find((e) => e.id === headEmployeeId);

    const payload = {
      id: editingDept?.id,
      organizationId: "org-coralgenz-01",
      name,
      code: code.toUpperCase(),
      description,
      headEmployeeId: headEmployeeId || undefined,
      headEmployeeName: headEmp ? `${headEmp.firstName} ${headEmp.lastName}` : undefined,
      colorHex,
      employeeCount: editingDept?.employeeCount || 0,
      monthlyPayrollCost: editingDept?.monthlyPayrollCost || 0,
    };

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.department) {
        success(
          editingDept ? "Department Updated" : "Department Created",
          `Saved ${name} (${code.toUpperCase()}) to server.`
        );
        setShowModal(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        refreshData();
        onRefresh?.();
      } else {
        error("Error", data.error || "Failed to save department on server.");
      }
    } catch (err: any) {
      error("Network Error", err.message || "Failed to save department.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"?`)) return;
    try {
      const res = await fetch(`/api/departments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("Department Deleted", `Removed department from server.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        refreshData();
        onRefresh?.();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Department Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize company divisions, assign department leaders, and monitor department-wise payroll budgets.
          </p>
        </div>

        <Button
          variant="coral"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id} hoverEffect className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: dept.colorHex || "#ff5722" }}
                >
                  {dept.code}
                </div>
                <div>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                  <p className="text-[11px] text-slate-400">
                    Head: {dept.headEmployeeName || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(dept)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 min-h-[36px] line-clamp-2">
                {dept.description || "No description provided."}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Team Size
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {dept.employeeCount} Members
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Monthly Cost
                  </span>
                  <p className="font-bold text-coral-600 dark:text-coral-400 mt-0.5 font-mono">
                    {formatINR(dept.monthlyPayrollCost)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL: ADD/EDIT DEPARTMENT */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDept ? "Edit Department" : "Create New Department"}
        description="Configure department information and leadership on server"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Marketing"
            />
            <Input
              label="Short Code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ENG, MKT"
            />
          </div>

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of responsibilities"
          />

          <Select
            label="Department Head"
            value={headEmployeeId}
            onChange={(e) => setHeadEmployeeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.designationTitle})
              </option>
            ))}
          </Select>

          <Input
            label="Badge Color (Hex)"
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              {editingDept ? "Update Department" : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
