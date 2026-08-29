"use client";

import React, { useState, useEffect } from "react";
import { Designation, Department } from "@/types";
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
  Trash2,
} from "lucide-react";

interface DesignationManagerProps {
  initialDesignations: Designation[];
  departments: Department[];
  onRefresh?: () => void;
}

export function DesignationManager({
  initialDesignations,
  departments,
  onRefresh,
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

  useEffect(() => {
    setDesignations(initialDesignations);
  }, [initialDesignations]);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/designations", { cache: "no-store" });
      const data = await res.json();
      if (data?.designations) {
        setDesignations(data.designations);
      }
    } catch {}
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      error("Missing Title", "Please provide a designation title.");
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);

    const payload = {
      id: editingDesig?.id,
      organizationId: "org-coralgenz-01",
      title,
      departmentId,
      departmentName: dept?.name || "General",
      description,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      employeeCount: editingDesig?.employeeCount || 0,
      status: "active",
    };

    try {
      const res = await fetch("/api/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.designation) {
        success(
          editingDesig ? "Designation Updated" : "Designation Created",
          `Saved designation ${title} on server.`
        );
        setShowModal(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        refreshData();
        onRefresh?.();
      } else {
        error("Error", data.error || "Failed to save designation on server.");
      }
    } catch (err: any) {
      error("Network Error", err.message || "Failed to save designation.");
    }
  };

  const handleDelete = async (id: string, desigTitle: string) => {
    if (!confirm(`Delete designation "${desigTitle}"?`)) return;
    try {
      const res = await fetch(`/api/designations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("Designation Deleted", `Removed designation from server.`);
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
                <Badge variant="secondary" size="sm">
                  {desig.departmentName}
                </Badge>
                <CardTitle className="text-base pt-1">{desig.title}</CardTitle>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(desig)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(desig.id, desig.title)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 min-h-[36px] line-clamp-2">
                {desig.description || "Role responsibilities standard across company operations."}
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Band Range
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {formatINR(desig.minSalary)} - {formatINR(desig.maxSalary)}
                  </span>
                </div>
                <Badge variant="success" size="sm">Active Role</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL: ADD/EDIT DESIGNATION */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDesig ? "Edit Designation" : "Create New Designation"}
        description="Define standard role requirements and approved salary bands"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Designation Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />

          <Select
            label="Assigned Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </Select>

          <Input
            label="Role Overview"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Core competencies and responsibilities"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Monthly Salary (₹)"
              type="number"
              required
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
            />
            <Input
              label="Maximum Monthly Salary (₹)"
              type="number"
              required
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
