"use client";

import React, { useState } from "react";
import { Designation, Department } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Briefcase,
  Plus,
  Building2,
  Users,
  Edit2,
} from "lucide-react";

interface DesignationManagerProps {
  initialDesignations: Designation[];
  departments: Department[];
}

export function DesignationManager({
  initialDesignations,
  departments,
}: DesignationManagerProps) {
  const { success, error } = useToast();
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations);
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);

  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "dept-01");
  const [description, setDescription] = useState("");
  const [minSalary, setMinSalary] = useState(50000);
  const [maxSalary, setMaxSalary] = useState(100000);

  const refreshData = () => {
    setDesignations(MockDataStore.getDesignations());
  };

  const handleOpenAdd = () => {
    setEditingDesig(null);
    setTitle("");
    setDepartmentId(departments[0]?.id || "dept-01");
    setDescription("");
    setMinSalary(50000);
    setMaxSalary(100000);
    setShowModal(true);
  };

  const handleOpenEdit = (desig: Designation) => {
    setEditingDesig(desig);
    setTitle(desig.title);
    setDepartmentId(desig.departmentId);
    setDescription(desig.description || "");
    setMinSalary(desig.minSalary);
    setMaxSalary(desig.maxSalary);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      error("Missing Title", "Please provide a designation title.");
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);

    if (editingDesig) {
      const list = MockDataStore.getDesignations();
      const idx = list.findIndex((d) => d.id === editingDesig.id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          title,
          departmentId,
          departmentName: dept?.name || "General",
          description,
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("coralgenz_designations", JSON.stringify(list));
      }
      success("Designation Updated", `Updated designation ${title}`);
    } else {
      MockDataStore.addDesignation({
        organizationId: "org-coralgenz-01",
        title,
        departmentId,
        departmentName: dept?.name || "General",
        description,
        minSalary: Number(minSalary),
        maxSalary: Number(maxSalary),
        employeeCount: 0,
        status: "active",
      });
      success("Designation Created", `Created designation ${title}`);
    }

    setShowModal(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Designation & Role Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized job titles, salary bands, and department hierarchies.
          </p>
        </div>

        <Button
          variant="coral"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Designation
        </Button>
      </div>

      {/* Grid of Designations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designations.map((desig) => (
          <Card key={desig.id} hoverEffect className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{desig.title}</CardTitle>
                <Badge variant="coral" size="sm">
                  {desig.departmentName}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(desig)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 min-h-[36px] line-clamp-2">
                {desig.description || "Standard role responsibilities."}
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Salary Band:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(desig.minSalary)} - {formatINR(desig.maxSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Active Headcount:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {desig.employeeCount} Employees
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL: ADD/EDIT DESIGNATION */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDesig ? "Edit Designation" : "Add New Designation"}
        description="Configure role title, department mapping, and salary ranges"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Designation Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />

          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>

          <Input
            label="Role Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key responsibilities and qualifications"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Monthly Salary (₹)"
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
            />
            <Input
              label="Maximum Monthly Salary (₹)"
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(Number(e.target.value))}
            />
          </div>

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
              {editingDesig ? "Update Designation" : "Create Designation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
