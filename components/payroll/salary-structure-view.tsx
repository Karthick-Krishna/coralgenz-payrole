"use client";

import React, { useState, useEffect } from "react";
import { SalaryStructure, StatutoryRulesConfig } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Settings,
  ShieldCheck,
  Save,
  CheckCircle2,
  DollarSign,
  Plus,
} from "lucide-react";

interface SalaryStructureViewProps {
  initialStructure: SalaryStructure;
  onRefresh?: () => void;
}

export function SalaryStructureView({ initialStructure, onRefresh }: SalaryStructureViewProps) {
  const { success, error } = useToast();
  const [structure, setStructure] = useState<SalaryStructure>(initialStructure);
  const [statConfig, setStatConfig] = useState<StatutoryRulesConfig>(
    initialStructure.statutoryConfig
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStructure(initialStructure);
    setStatConfig(initialStructure.statutoryConfig);
  }, [initialStructure]);

  const handleStatChange = (field: keyof StatutoryRulesConfig, val: number | boolean) => {
    setStatConfig((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: SalaryStructure = {
        ...structure,
        statutoryConfig: statConfig,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/salary-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok && data.salaryStructure) {
        setStructure(data.salaryStructure);
        success("Structure Updated", "Indian statutory payroll & tax rules successfully saved on server.");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        onRefresh?.();
      } else {
        error("Save Error", data.error || "Failed to update salary structure.");
      }
    } catch (err: any) {
      error("Network Error", err.message || "Failed to update salary structure.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Salary Structures & Statutory Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure Indian standard CTC components, PF formulas, ESI limits, Professional Tax, and TDS slabs.
          </p>
        </div>

        <Button
          type="submit"
          variant="coral"
          size="sm"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Main Grid: Earnings Formula + Statutory Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Component Percentages */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Formula (% of CTC)</CardTitle>
            <p className="text-xs text-slate-500">Standard compensation component weighting</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Basic Salary Percentage (%)"
              type="number"
              required
              value={structure.basicSalaryPercent}
              onChange={(e) =>
                setStructure((prev) => ({
                  ...prev,
                  basicSalaryPercent: Number(e.target.value),
                }))
              }
              helperText="Typically 40% - 50% of monthly CTC in India"
            />

            <Input
              label="House Rent Allowance (HRA % of Basic)"
              type="number"
              required
              value={structure.hraPercent}
              onChange={(e) =>
                setStructure((prev) => ({
                  ...prev,
                  hraPercent: Number(e.target.value),
                }))
              }
              helperText="Typically 40% (Non-Metro) or 50% (Metro) of Basic Salary"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Conveyance Allowance (₹ / mo)"
                type="number"
                value={structure.conveyanceAllowance}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    conveyanceAllowance: Number(e.target.value),
                  }))
                }
              />
              <Input
                label="Medical Allowance (₹ / mo)"
                type="number"
                value={structure.medicalAllowance}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    medicalAllowance: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 space-y-1">
              <p>• Special Allowance acts as the balancing component (Gross − Basic − HRA − Conveyance − Medical).</p>
            </div>
          </CardContent>
        </Card>

        {/* Indian Statutory Deductions (PF / ESI / PT / TDS) */}
        <Card>
          <CardHeader>
            <CardTitle>Statutory Compliance Rules</CardTitle>
            <p className="text-xs text-slate-500">Provident Fund, ESI, Professional Tax & TDS</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provident Fund (PF) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Provident Fund (EPF/EPS)
                </span>
                <Badge variant="success" size="sm">
                  Active (12%)
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Employee PF %"
                  type="number"
                  value={statConfig.pfEmployeePercent}
                  onChange={(e) => handleStatChange("pfEmployeePercent", Number(e.target.value))}
                />
                <Input
                  label="Wage Ceiling (₹)"
                  type="number"
                  value={statConfig.pfWageCeiling}
                  onChange={(e) => handleStatChange("pfWageCeiling", Number(e.target.value))}
                  helperText="₹15,000 standard statutory ceiling"
                />
              </div>
            </div>

            {/* Employee State Insurance (ESI) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Employee State Insurance (ESI)
                </span>
                <Badge variant="coral" size="sm">
                  Gross &le; ₹21,000
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Employee ESI %"
                  type="number"
                  step="0.05"
                  value={statConfig.esiEmployeePercent}
                  onChange={(e) => handleStatChange("esiEmployeePercent", Number(e.target.value))}
                />
                <Input
                  label="Eligibility Wage Limit (₹)"
                  type="number"
                  value={statConfig.esiWageCeiling}
                  onChange={(e) => handleStatChange("esiWageCeiling", Number(e.target.value))}
                  helperText="Applies only if Gross &le; ₹21,000"
                />
              </div>
            </div>

            {/* Professional Tax (PT) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Professional Tax (State Slab)
                </span>
                <Badge variant="secondary" size="sm">
                  Karnataka Standard
                </Badge>
              </div>
              <Input
                label="Monthly PT Deduction (₹)"
                type="number"
                value={statConfig.ptMonthlyFlat}
                onChange={(e) => handleStatChange("ptMonthlyFlat", Number(e.target.value))}
                helperText="₹200 per month for gross &gt; ₹15,000"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
