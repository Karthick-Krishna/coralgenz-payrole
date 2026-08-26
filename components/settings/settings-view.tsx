"use client";

import React, { useState, useEffect } from "react";
import { Organization, User, UserRole } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
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
  UserCheck,
  Plus,
  Trash2,
  Shield,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface SettingsViewProps {
  initialOrg: Organization;
}

export function SettingsView({ initialOrg }: SettingsViewProps) {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("organization");
  const [org, setOrg] = useState<Organization>(initialOrg);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("employee");

  useEffect(() => {
    setUsers(MockDataStore.getUsers());
  }, []);

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
      setUsers(MockDataStore.getUsers());
      success("Store Reset", "Demo data refreshed to default state.");
    }
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      error("Permission Denied", "Only Super Admin Karthick Krishna can modify user roles.");
      return;
    }

    const updated = MockDataStore.updateUserRole(userId, newRole, currentUser?.displayName || "Super Admin");
    if (updated) {
      setUsers(MockDataStore.getUsers());
      success("Role Updated", `Assigned ${newRole.replace("_", " ").toUpperCase()} role to ${updated.displayName}`);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      error("Missing Fields", "Please enter both name and corporate email.");
      return;
    }

    const newUser = MockDataStore.addUser({
      email: newUserEmail.toLowerCase().trim(),
      displayName: newUserName,
      role: newUserRole,
      organizationId: org.id,
      isActive: true,
    });

    setUsers(MockDataStore.getUsers());
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserEmail("");
    success("User Provisioned", `Created access for ${newUser.displayName} as ${newUser.role.toUpperCase()}`);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Remove user access for ${userName}?`)) {
      MockDataStore.deleteUser(userId);
      setUsers(MockDataStore.getUsers());
      success("User Removed", `Revoked access for ${userName}`);
    }
  };

  const tabs = [
    { id: "organization", label: "Organization Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "user_roles", label: "User Access & Role Delegation", icon: <UserCheck className="w-4 h-4" /> },
    { id: "payroll_rules", label: "Payroll & IDs", icon: <CreditCard className="w-4 h-4" /> },
    { id: "shifts", label: "Shifts & Working Days", icon: <Clock className="w-4 h-4" /> },
    { id: "permissions_matrix", label: "RBAC Permissions Matrix", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Organization & System Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Corporate identity, user access role delegation by Super Admin, payroll calculation rules, and shifts.
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
          {activeTab !== "user_roles" && (
            <Button
              type="button"
              variant="coral"
              size="sm"
              isLoading={isSaving}
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Settings
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </CardHeader>
      </Card>

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === "organization" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Company & Legal Details</CardTitle>
            <p className="text-xs text-slate-500">Official company identification for payslips and tax filing</p>
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
                label="Official Website"
                value={org.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Corporate Email"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="PAN Number"
                value={org.panNumber || ""}
                onChange={(e) => handleChange("panNumber", e.target.value)}
                placeholder="AAACC1234K"
              />
              <Input
                label="GSTIN"
                value={org.gstin || ""}
                onChange={(e) => handleChange("gstin", e.target.value)}
                placeholder="29AAACC1234K1Z5"
              />
              <Input
                label="PF Registration Number"
                value={org.pfRegistrationNumber || ""}
                onChange={(e) => handleChange("pfRegistrationNumber", e.target.value)}
                placeholder="KN/BNG/0012345/000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Registered Office Address
              </label>
              <textarea
                rows={2}
                value={org.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: USER ACCESS & ROLE DELEGATION (MANAGED BY SUPER ADMIN) */}
      {activeTab === "user_roles" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Access & Role Delegation</CardTitle>
              <p className="text-xs text-slate-500">
                Super Admin Karthick Krishna assigns access roles for HR, Payroll, Managers, and Employees
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                variant="coral"
                size="sm"
                onClick={() => setShowAddUserModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Provision User Access
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
              <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-sky-900 dark:text-sky-200">
                  Role Governance Protocol:
                </p>
                <p>
                  • <strong>Super Admin (`karthick@coralgenz.co.in`)</strong> has master authority to assign roles and switch between any portal views.
                </p>
                <p>
                  • Other staff (HR Admin, Payroll Manager, Team Managers, Employees) are restricted strictly to their assigned login portals and cannot switch roles without logging in.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {users.map((u) => {
                const isSuper = u.role === "super_admin" || u.email.toLowerCase() === "karthick@coralgenz.co.in";
                return (
                  <div
                    key={u.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 overflow-hidden flex items-center justify-center shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                            {u.displayName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {u.displayName}
                          </span>
                          {isSuper && (
                            <Badge variant="coral" size="sm">
                              👑 Master Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-48">
                        <Select
                          value={u.role}
                          disabled={!isSuperAdmin || (isSuper && u.id === currentUser?.id)}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                        >
                          <option value="super_admin">👑 Super Administrator</option>
                          <option value="hr_admin">💼 HR Administrator</option>
                          <option value="payroll_manager">📊 Payroll Manager</option>
                          <option value="manager">👔 Team Manager</option>
                          <option value="employee">👩‍💻 Employee</option>
                        </Select>
                      </div>

                      {isSuperAdmin && !isSuper && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.displayName)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Revoke access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PAYROLL RULES & IDS */}
      {activeTab === "payroll_rules" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Payroll Cycle & Automatic Prefixes</CardTitle>
            <p className="text-xs text-slate-500">Identifiers for auto-generated payslips and employee profiles</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Employee ID Prefix"
                value={org.employeeIdPrefix}
                onChange={(e) => handleChange("employeeIdPrefix", e.target.value)}
                placeholder="CGG-EMP-"
              />
              <Input
                label="Payslip Number Prefix"
                value={org.payslipNumberPrefix}
                onChange={(e) => handleChange("payslipNumberPrefix", e.target.value)}
                placeholder="CGG-PS-"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default Currency"
                value={org.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </Select>

              <Select
                label="Payroll Frequency"
                value={org.payrollFrequency}
                onChange={(e) => handleChange("payrollFrequency", e.target.value)}
              >
                <option value="monthly">Monthly Processing (Standard)</option>
                <option value="biweekly">Bi-weekly Processing</option>
                <option value="weekly">Weekly Processing</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SHIFTS & WORKING DAYS */}
      {activeTab === "shifts" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader>
            <CardTitle>Working Hours & Shift Configuration</CardTitle>
            <p className="text-xs text-slate-500">Operational shift timings for biometric tracking and overtime</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Time Zone"
                value={org.timeZone}
                onChange={(e) => handleChange("timeZone", e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              </Select>

              <Select
                label="Financial Year Starting Month"
                value={org.financialYearStartMonth}
                onChange={(e) => handleChange("financialYearStartMonth", Number(e.target.value))}
              >
                <option value={4}>April (Indian Statutory Standard)</option>
                <option value={1}>January (Calendar Year)</option>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Standard Corporate Schedule
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <p>• Working Days: Monday to Friday (5-day work week)</p>
                <p>• Weekly Off Days: Saturday & Sunday</p>
                <p>• Standard Shift: 09:00 AM – 06:00 PM (9 hours with 1h lunch break)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: RBAC PERMISSIONS MATRIX */}
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

      {/* MODAL: PROVISION NEW USER */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Provision User Access"
        description="Super Admin creates login access and assigns corporate system role."
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <Input
            label="User Full Name"
            required
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="e.g. Anand Sharma"
          />

          <Input
            label="Corporate Email Address"
            type="email"
            required
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="anand@coralgenz.co.in"
          />

          <Select
            label="Assigned System Role"
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
          >
            <option value="employee">👩‍💻 Employee (Self-Service)</option>
            <option value="manager">👔 Team Manager</option>
            <option value="payroll_manager">📊 Payroll Manager</option>
            <option value="hr_admin">💼 HR Administrator</option>
            <option value="super_admin">👑 Super Administrator</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddUserModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Grant Access
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
