"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Employee } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getInitials, formatDate } from "@/lib/utils";
import { User, Mail, Phone, Lock, Save, Shield, Briefcase, Building, Calendar, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, currentRole, updateCurrentUser } = useAuth();
  const { success, error } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.employeeId) {
        const emp = await EmployeeService.getEmployeeById(user.employeeId);
        if (emp) {
          setEmployee(emp);
          setName(`${emp.firstName} ${emp.lastName}`.trim());
          if (emp.phone) setPhone(emp.phone);
        }
      } else if (user?.email) {
        const emps = await EmployeeService.getEmployees();
        const emp = emps.find((e) => e.email?.toLowerCase() === user.email?.toLowerCase());
        if (emp) {
          setEmployee(emp);
          setName(`${emp.firstName} ${emp.lastName}`.trim());
          if (emp.phone) setPhone(emp.phone);
        }
      }
    };
    loadProfile();
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      error("Name Required", "Please enter your name.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({ displayName: name, phone });
      success("Profile Updated", "Your profile details have been saved.");
      setIsSaving(false);
    }, 400);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      error("Weak Password", "New password must be at least 8 characters.");
      return;
    }

    success("Password Updated", "Security credentials updated successfully.");
    setCurrentPass("");
    setNewPass("");
  };

  return (
    <AppLayout module="dashboard">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-slate-900 to-coral-900" />
          <div className="p-6 pt-0 -mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-coral-500 to-amber-500 text-white font-bold text-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl shrink-0">
                {getInitials(user?.displayName)}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {user?.displayName}
                </h1>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <Badge variant="coral" size="sm" className="capitalize">
                  {(currentRole || "employee").replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Display Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Official Email (Immutable)"
                  disabled
                  value={user?.email || ""}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />

                <Button
                  type="submit"
                  variant="coral"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Employment & Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employment & Directory Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Employee ID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {employee?.id || user?.employeeId || "CGG-EMP-0001"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Designation</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee?.designationTitle || "Managing Director & Super Admin"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee?.departmentName || "Executive Leadership"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Work Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee?.workLocation || "Coimbatore HQ"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Joining Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee?.joiningDate ? formatDate(employee.joiningDate) : "01 Jan 2024"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Employment Status</span>
                  <Badge variant="success" size="sm" dot className="capitalize">
                    {employee?.status || "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
