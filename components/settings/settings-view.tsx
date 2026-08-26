"use client";

import React, { useState } from "react";
import { Organization } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS } from "@/lib/permissions/rbac";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  CreditCard,
  Clock,
  ShieldCheck,
  Save,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface SettingsViewProps {
  initialOrg: Organization;
}

export function SettingsView({ initialOrg }: SettingsViewProps) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("organization");
  const [org, setOrg] = useState<Organization>(initialOrg);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof Organization, val: string | number | boolean | number[]) => {
    setOrg((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const updated = MockDataStore.updateOrganization(org);
      setOrg(updated);
      success("Settings Saved", "Organization configuration updated successfully.");
      setIsSaving(false);
    }, 400);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset local demo data store to fresh corporate defaults?")) {
      MockDataStore.resetToDefaults();
      setOrg(MockDataStore.getOrganization());
      success("Store Reset", "Demo data refreshed to default state.");
    }
  };

  const tabs = [
    { id: "organization", label: "Organization Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "payroll_rules", label: "Payroll & IDs", icon: <CreditCard className="w-4 h-4" /> },
    { id: "shifts", label: "Shifts & Working Days", icon: <Clock className="w-4 h-4" /> },
    { id: "permissions_matrix", label: "RBAC Permissions Matrix", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Organization & System Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Corporate identity, tax identification (PAN/GSTIN), currency formatting, shifts, and role-based permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Demo Data
          </Button>
          <Button
            type="submit"
            variant="coral"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === "organization" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Company Identity & Contact</CardTitle>
            <p className="text-xs text-slate-500">Legal business registration details and tax identity</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Legal Name"
                required
                value={org.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <Input
                label="Tagline"
                value={org.tagline || ""}
                onChange={(e) => handleChange("tagline", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Official Email"
                type="email"
                required
                value={org.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <Input
                label="Corporate Phone"
                value={org.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <Input
                label="Website URL"
                value={org.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            <Input
              label="HQ Physical Address"
              value={org.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="City"
                value={org.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
              <Input
                label="State"
                value={org.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
              <Input
                label="Country"
                value={org.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
              <Input
                label="Postal PIN"
                value={org.postalCode || ""}
                onChange={(e) => handleChange("postalCode", e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GSTIN Number (India)"
                value={org.gstin || ""}
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                placeholder="29AAACC1234K1Z5"
              />
              <Input
                label="PAN Number (India)"
                value={org.panNumber || ""}
                onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                placeholder="AAACC1234K"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PAYROLL & ID RULES */}
      {activeTab === "payroll_rules" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Payroll Cycle & Unique ID Prefixes</CardTitle>
            <p className="text-xs text-slate-500">Configure automated numbering formats for employees and payslips</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Disbursement Currency"
                value={org.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              >
                <option value="INR">Indian Rupee (INR ₹)</option>
                <option value="USD">US Dollar (USD $)</option>
                <option value="EUR">Euro (EUR €)</option>
                <option value="GBP">British Pound (GBP £)</option>
              </Select>

              <Select
                label="Payroll Frequency"
                value={org.payrollFrequency}
                onChange={(e) => handleChange("payrollFrequency", e.target.value as Organization["payrollFrequency"])}
              >
                <option value="monthly">Monthly (Default)</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </Select>

              <Select
                label="Financial Year Start"
                value={org.financialYearStartMonth}
                onChange={(e) => handleChange("financialYearStartMonth", Number(e.target.value))}
              >
                <option value={4}>April (Indian Standard)</option>
                <option value={1}>January (Calendar Year)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Input
                label="Employee ID Prefix"
                value={org.employeeIdPrefix}
                onChange={(e) => handleChange("employeeIdPrefix", e.target.value.toUpperCase())}
                helperText="Generates IDs like CGG-EMP-0001, CGG-EMP-0002"
              />
              <Input
                label="Payslip Reference Prefix"
                value={org.payslipNumberPrefix}
                onChange={(e) => handleChange("payslipNumberPrefix", e.target.value.toUpperCase())}
                helperText="Generates Doc IDs like CGG-PS-2026-08-0001"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SHIFTS & WORKING DAYS */}
      {activeTab === "shifts" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Working Days & Office Shifts</CardTitle>
            <p className="text-xs text-slate-500">Weekly off schedule and organization timezone</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Timezone"
                value={org.timeZone}
                onChange={(e) => handleChange("timeZone", e.target.value)}
                placeholder="Asia/Kolkata"
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Standard Work Schedule
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <p>• Working Days: Monday to Friday (5-day work week)</p>
                  <p>• Weekly Off Days: Saturday & Sunday</p>
                  <p>• Standard Shift: 09:00 AM – 06:00 PM (9 hours with 1h lunch break)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: RBAC PERMISSIONS MATRIX */}
      {activeTab === "permissions_matrix" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Granular RBAC Permissions Matrix</CardTitle>
            <p className="text-xs text-slate-500">Security model enforcing backend and UI module access controls</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(
                [
                  { role: "super_admin", label: "Super Admin", color: "coral" },
                  { role: "hr_admin", label: "HR Admin", color: "info" },
                  { role: "payroll_manager", label: "Payroll Manager", color: "purple" },
                  { role: "manager", label: "Team Manager", color: "warning" },
                  { role: "employee", label: "Employee (Self-Service)", color: "success" },
                ] as const
              ).map(({ role, label }) => {
                const perms = ROLE_PERMISSIONS[role] || [];
                return (
                  <div
                    key={role}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {label}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {perms.length} Permissions Granted
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {perms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-400"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
