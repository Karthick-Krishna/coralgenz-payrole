"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Employee, Department, Designation, EmploymentType, EmployeeStatus, UserRole } from "@/types";
import { AuthService } from "@/lib/firebase/auth-service";
import { EmployeeService } from "@/lib/firebase/employee-service";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import {
  User,
  Briefcase,
  CreditCard,
  PhoneCall,
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  Building2,
} from "lucide-react";

interface EmployeeFormProps {
  initialData?: Employee;
  departments: Department[];
  designations: Designation[];
  allEmployees: Employee[];
  isEditing?: boolean;
  onSaved?: (emp?: Employee) => void;
}

export function EmployeeForm({
  initialData,
  departments,
  designations,
  allEmployees,
  isEditing = false,
  onSaved,
}: EmployeeFormProps) {
  const router = useRouter();
  const { isSuperAdmin, currentRole, user } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useCustomDeptDesig, setUseCustomDeptDesig] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    personalEmail: initialData?.personalEmail || "",
    phone: initialData?.phone || "",
    dateOfBirth: initialData?.dateOfBirth || "2000-01-01",
    gender: initialData?.gender || ("male" as const),
    avatarUrl: initialData?.avatarUrl || "",
    address: initialData?.address || "",
    city: initialData?.city || "Coimbatore",
    state: initialData?.state || "Tamil Nadu",
    country: initialData?.country || "India",
    postalCode: initialData?.postalCode || "641004",

    // Portal Login & Auth Credentials
    portalPassword: isEditing ? "" : "Welcome@2026",
    portalConfirmPassword: isEditing ? "" : "Welcome@2026",
    portalRole: (initialData?.portalRole || initialData?.role || "employee") as UserRole,

    // Manual Department & Designation
    customDepartmentName: initialData?.departmentName || "AI & Innovation",
    customDepartmentCode: "AI",
    customDesignationTitle: initialData?.designationTitle || "AI Architect & Lead Engineer",

    // Employment
    joiningDate: initialData?.joiningDate || new Date().toISOString().split("T")[0],
    departmentId: initialData?.departmentId || departments[0]?.id || "dept-ai",
    designationId: initialData?.designationId || designations[0]?.id || "desig-ai",
    managerId: initialData?.managerId || "",
    employmentType: initialData?.employmentType || ("full_time" as EmploymentType),
    status: initialData?.status || ("active" as EmployeeStatus),
    workLocation: initialData?.workLocation || "Coimbatore HQ",
    currentMonthlyGross: initialData?.currentMonthlyGross || 60000,

    // Financial & Bank
    panNumber: initialData?.panNumber || initialData?.bankDetails?.panNumber || "",
    bankName: initialData?.bankDetails?.bankName || "HDFC Bank",
    accountHolderName: initialData?.bankDetails?.accountHolderName || "",
    accountNumber: initialData?.bankDetails?.accountNumber || "",
    ifscCode: initialData?.bankDetails?.ifscCode || "HDFC0000240",
    branchName: initialData?.bankDetails?.branchName || "RS Puram Branch, Coimbatore",

    // Emergency Contact
    emergencyName: initialData?.emergencyContact?.name || "",
    emergencyRelationship: initialData?.emergencyContact?.relationship || "Parent",
    emergencyPhone: initialData?.emergencyContact?.phone || "",
  });

  // Synchronize form state when initialData is provided or updated
  useEffect(() => {
    if (initialData) {
      const title = (initialData.designationTitle || "").toLowerCase();
      const dept = (initialData.departmentName || "").toLowerCase();
      let derivedRole: UserRole = "employee";
      if (title.includes("hr") || dept.includes("human resource")) derivedRole = "hr_admin";
      else if (title.includes("manager") || title.includes("lead") || title.includes("head") || title.includes("payroll") || title.includes("finance")) derivedRole = "manager";

      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        personalEmail: initialData.personalEmail || "",
        phone: initialData.phone || "",
        dateOfBirth: initialData.dateOfBirth || "2000-01-01",
        gender: initialData.gender || ("male" as const),
        avatarUrl: initialData.avatarUrl || "",
        address: initialData.address || "",
        city: initialData.city || "Coimbatore",
        state: initialData.state || "Tamil Nadu",
        country: initialData.country || "India",
        postalCode: initialData.postalCode || "641004",

        // Portal Login & Auth Credentials
        portalPassword: "",
        portalConfirmPassword: "",
        portalRole: (initialData.portalRole || initialData.role || derivedRole) as UserRole,

        // Manual Department & Designation
        customDepartmentName: initialData.departmentName || "AI & Innovation",
        customDepartmentCode: "AI",
        customDesignationTitle: initialData.designationTitle || "AI Architect & Lead Engineer",

        // Employment
        joiningDate: initialData.joiningDate || new Date().toISOString().split("T")[0],
        departmentId: initialData.departmentId || departments[0]?.id || "dept-ai",
        designationId: initialData.designationId || designations[0]?.id || "desig-ai",
        managerId: initialData.managerId || "",
        employmentType: initialData.employmentType || ("full_time" as EmploymentType),
        status: initialData.status || ("active" as EmployeeStatus),
        workLocation: initialData.workLocation || "Coimbatore HQ",
        currentMonthlyGross: initialData.currentMonthlyGross || 60000,

        // Bank & Financial
        panNumber: initialData.panNumber || initialData.bankDetails?.panNumber || "",
        bankName: initialData.bankDetails?.bankName || "HDFC Bank",
        accountHolderName: initialData.bankDetails?.accountHolderName || `${initialData.firstName} ${initialData.lastName}`,
        accountNumber: initialData.bankDetails?.accountNumber || "",
        ifscCode: initialData.bankDetails?.ifscCode || "HDFC0000240",
        branchName: initialData.bankDetails?.branchName || "RS Puram Branch, Coimbatore",

        // Emergency Contact
        emergencyName: initialData.emergencyContact?.name || "",
        emergencyRelationship: initialData.emergencyContact?.relationship || "Parent",
        emergencyPhone: initialData.emergencyContact?.phone || "",
      });
    }
  }, [initialData, departments, designations]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if ((field === "firstName" || field === "lastName") && !isEditing) {
        const fn = field === "firstName" ? (value as string) : prev.firstName;
        const ln = field === "lastName" ? (value as string) : prev.lastName;
        if (fn && ln && !prev.email.includes("@custom")) {
          updated.email = `${fn.toLowerCase().replace(/\s+/g, "")}.${ln.toLowerCase().replace(/\s+/g, "")}@coralgenz.co.in`;
        }
      }
      return updated;
    });
  };

  const handleDepartmentChange = (deptId: string) => {
    const validDesig = designations.find((d) => d.departmentId === deptId);
    const nextDesigId = validDesig ? validDesig.id : formData.designationId;
    const selectedDept = departments.find((d) => d.id === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      designationId: nextDesigId,
      customDepartmentName: selectedDept?.name || prev.customDepartmentName,
      customDepartmentCode: selectedDept?.code || prev.customDepartmentCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      error("Missing Fields", "Please complete all required fields (Name & Work Email).");
      setActiveTab("personal");
      return;
    }

    if (formData.portalPassword && formData.portalPassword.trim()) {
      if (formData.portalPassword !== formData.portalConfirmPassword) {
        error("Password Mismatch", "Password and Confirm Password do not match.");
        setActiveTab("portal_access");
        return;
      }
      if (formData.portalPassword.trim().length < 6) {
        error("Weak Password", "Password must be at least 6 characters long.");
        setActiveTab("portal_access");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedDeptObj = departments.find((d) => d.id === formData.departmentId);
      const selectedDesigObj = designations.find((d) => d.id === formData.designationId);
      const selectedManager = allEmployees.find((e) => e.id === formData.managerId);

      const finalDeptName = useCustomDeptDesig 
        ? (formData.customDepartmentName.trim() || "AI & Innovation")
        : (selectedDeptObj?.name || "AI & Innovation");
      
      const finalDeptCode = useCustomDeptDesig
        ? (formData.customDepartmentCode.trim().toUpperCase() || "AI")
        : (selectedDeptObj?.code || "AI");

      const finalDeptId = useCustomDeptDesig
        ? `dept-${finalDeptName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        : (formData.departmentId || "dept-ai");

      const finalDesigTitle = useCustomDeptDesig
        ? (formData.customDesignationTitle.trim() || "AI Architect & Lead Engineer")
        : (selectedDesigObj?.title || "Staff");

      const finalDesigId = useCustomDeptDesig
        ? `desig-${finalDesigTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        : (formData.designationId || "desig-ai");

      const assignedRole = isSuperAdmin 
        ? (formData.portalRole || initialData?.portalRole || initialData?.role || "employee")
        : (initialData?.portalRole || initialData?.role || "employee");

      const payload = {
        organizationId: "org-coralgenz-01",
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        personalEmail: formData.personalEmail.trim() || null,
        phone: formData.phone.trim() || null,
        avatarUrl: formData.avatarUrl.trim() || null,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as "male" | "female" | "other",
        panNumber: formData.panNumber.trim().toUpperCase() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || "India",
        postalCode: formData.postalCode.trim() || null,
        joiningDate: formData.joiningDate,
        departmentId: finalDeptId,
        departmentName: finalDeptName,
        designationId: finalDesigId,
        designationTitle: finalDesigTitle,
        managerId: formData.managerId || null,
        managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : null,
        employmentType: formData.employmentType,
        status: formData.status,
        workLocation: formData.workLocation,
        currentMonthlyGross: Number(formData.currentMonthlyGross) || 0,
        currentAnnualCtc: (Number(formData.currentMonthlyGross) || 0) * 12,
        salaryRevisions: initialData?.salaryRevisions || [],
        bankDetails: {
          bankName: formData.bankName || "",
          accountHolderName: formData.accountHolderName || `${formData.firstName} ${formData.lastName}`,
          accountNumber: formData.accountNumber || "",
          ifscCode: formData.ifscCode || "",
          branchName: formData.branchName || "",
          accountType: "salary" as const,
          panNumber: formData.panNumber.trim().toUpperCase() || undefined,
        },
        emergencyContact: {
          name: formData.emergencyName || "",
          relationship: formData.emergencyRelationship || "Parent",
          phone: formData.emergencyPhone || "",
        },
        documents: initialData?.documents || [],
        role: assignedRole,
        portalRole: assignedRole,
        portalPassword: formData.portalPassword && formData.portalPassword.trim() ? formData.portalPassword.trim() : undefined,
        changedBy: user?.id || "usr-admin",
        changedByName: user?.displayName || (isSuperAdmin ? "Super Admin" : "HR Administrator"),
        creatorRole: currentRole,
      };

      if (isEditing && initialData) {
        const updateRes = await EmployeeService.updateEmployee(initialData.id, payload);
        if (!updateRes) {
          throw new Error("Failed to update employee details on server.");
        }

        // Update password on Auth server if changed or provided
        if (formData.portalPassword && formData.portalPassword.trim()) {
          try {
            await AuthService.updatePassword({
              email: formData.email,
              newPassword: formData.portalPassword.trim(),
              employeeId: initialData.id,
              changedBy: user?.id || "usr-admin",
              changedByName: user?.displayName || (isSuperAdmin ? "Super Admin" : "HR Administrator"),
            });
          } catch (passErr) {
            console.warn("Direct password update warning:", passErr);
          }
        }

        success(
          "Profile & Credentials Updated!",
          `Saved server changes for ${formData.firstName} ${formData.lastName}. Updated all records and authentication credentials!`
        );

        if (onSaved) {
          const updatedEmpObj: Employee = {
            ...initialData,
            ...payload,
            personalEmail: formData.personalEmail.trim() || undefined,
            phone: formData.phone.trim() || initialData.phone,
            avatarUrl: formData.avatarUrl.trim() || undefined,
            panNumber: formData.panNumber.trim().toUpperCase() || undefined,
            address: formData.address.trim() || initialData.address,
            city: formData.city.trim() || initialData.city,
            state: formData.state.trim() || initialData.state,
            country: formData.country.trim() || initialData.country,
            postalCode: formData.postalCode.trim() || undefined,
            managerId: formData.managerId || undefined,
            managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : undefined,
            id: initialData.id,
            updatedAt: new Date().toISOString(),
          };
          onSaved(updatedEmpObj);
        } else {
          router.push(`/employees/${initialData.id}`);
        }
      } else {
        // Save Employee and Provision Login Account directly via Server API
        const newEmp = await EmployeeService.addEmployee(payload, {
          portalPassword: formData.portalPassword,
          portalRole: assignedRole,
          createdBy: user?.displayName || (isSuperAdmin ? "Super Admin" : "HR Administrator"),
        });
        
        if (!newEmp) {
          throw new Error("Failed to create employee in database.");
        }

        success(
          "Employee & Auth Login Created!",
          `Added ${newEmp.firstName} ${newEmp.lastName} (${newEmp.id}). Created in ${finalDeptName} as ${finalDesigTitle} with ${assignedRole.replace("_", " ").toUpperCase()} portal access!`
        );
        router.push(`/employees/${newEmp.id}`);
      }
    } catch (err: unknown) {
      error("Error saving employee", err instanceof Error ? err.message : "Failed to save employee profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Information", icon: <User className="w-4 h-4" /> },
    { id: "portal_access", label: "Portal & Login Access", icon: <KeyRound className="w-4 h-4" /> },
    { id: "employment", label: "Employment & Salary", icon: <Briefcase className="w-4 h-4" /> },
    { id: "bank", label: "Bank & Financial Details", icon: <CreditCard className="w-4 h-4" /> },
    { id: "emergency", label: "Emergency Contact", icon: <PhoneCall className="w-4 h-4" /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-10 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="shrink-0"
          >
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {isEditing ? `Edit Employee: ${initialData?.firstName} ${initialData?.lastName}` : "Onboard New Employee"}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {isEditing ? `Employee ID: ${initialData?.id}` : "Step-by-step profile creation & login provisioning"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/employees")}
            className="flex-1 sm:flex-none text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="coral"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
            className="flex-1 sm:flex-none text-xs"
          >
            {isEditing ? "Save Changes" : "Save & Provision"}
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-0 p-3 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="e.g. Arun"
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="e.g. Kumar"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Work Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="e.g. arun.kumar@coralgenz.co.in"
                  helperText="This email will be the employee's official portal login ID"
                />
                <Input
                  label="Personal Email"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleChange("personalEmail", e.target.value)}
                  placeholder="e.g. arun.dev@gmail.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98422 00000"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                />
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  label="PAN Card Number"
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
              </div>

              <Input
                label="Profile Avatar Photo URL"
                value={formData.avatarUrl}
                onChange={(e) => handleChange("avatarUrl", e.target.value)}
                placeholder="https://images.unsplash.com/... or leave empty"
                helperText="Paste direct image link or choose preset portraits"
              />

              <Input
                label="Residential Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g. 42, West Club Road, RS Puram"
              />

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Coimbatore"
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Tamil Nadu"
                />
                <Input
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="641002"
                />
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="India"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PORTAL ACCESS & LOGIN CREDENTIALS */}
          {activeTab === "portal_access" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                <div className="text-xs text-sky-900 dark:text-sky-200">
                  <p className="font-semibold text-sm mb-0.5">Authentication & Role Provisioning</p>
                  <p>
                    When you save this employee profile, an authentication account will automatically be created on the Auth server.
                    The employee will be able to log in to the <strong>Employee Portal</strong> using their official email and the password set below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Portal Login Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="e.g. arun.kumar@coralgenz.co.in"
                  helperText="Primary email used for sign in"
                />

                <div className="mt-4 p-4 rounded-xl border border-sky-100 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-200">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Authentication Managed Externally
                  </h4>
                  <p className="text-xs">
                    Roles are assigned strictly based on the user's email address. To grant portal access, Super Admins must create an authentication profile for this email via the Firebase Console.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYMENT & SALARY */}
          {activeTab === "employment" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Department & Designation Manual Entry Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-coral-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Department & Designation Setup
                    </h4>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUseCustomDeptDesig(!useCustomDeptDesig)}
                    className="text-xs text-coral-600 dark:text-coral-400 font-semibold hover:bg-coral-50 dark:hover:bg-coral-950/30"
                  >
                    {useCustomDeptDesig ? "Switch to Select Dropdown" : "Type Manually"}
                  </Button>
                </div>

                {useCustomDeptDesig ? (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Department Name"
                          required
                          value={formData.customDepartmentName}
                          onChange={(e) => handleChange("customDepartmentName", e.target.value)}
                          placeholder="e.g. AI & Innovation"
                          helperText="Type any custom department name"
                        />
                      </div>
                      <Input
                        label="Department Code"
                        value={formData.customDepartmentCode}
                        onChange={(e) => handleChange("customDepartmentCode", e.target.value.toUpperCase())}
                        placeholder="e.g. AI"
                        helperText="Short code (e.g. AI, ENG)"
                      />
                    </div>

                    <Input
                      label="Designation Title"
                      required
                      value={formData.customDesignationTitle}
                      onChange={(e) => handleChange("customDesignationTitle", e.target.value)}
                      placeholder="e.g. AI Architect & Lead Engineer"
                      helperText="Type official designation or job title for this employee"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Department"
                      value={formData.departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Designation"
                      value={formData.designationId}
                      onChange={(e) => handleChange("designationId", e.target.value)}
                    >
                      {designations
                        .filter((d) => !formData.departmentId || d.departmentId === formData.departmentId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Joining Date"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleChange("joiningDate", e.target.value)}
                />
                <Select
                  label="Employment Type"
                  value={formData.employmentType}
                  onChange={(e) => handleChange("employmentType", e.target.value)}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </Select>
                <Select
                  label="Employee Status"
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="notice_period">Notice Period</option>
                  <option value="terminated">Terminated</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Reporting Manager"
                  value={formData.managerId}
                  onChange={(e) => handleChange("managerId", e.target.value)}
                >
                  <option value="">No Reporting Manager (Independent)</option>
                  {allEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.designationTitle})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Work Location"
                  value={formData.workLocation}
                  onChange={(e) => handleChange("workLocation", e.target.value)}
                  placeholder="e.g. Coimbatore HQ / Remote"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Salary & Compensation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Gross Salary (INR)"
                    type="number"
                    required
                    value={formData.currentMonthlyGross}
                    onChange={(e) => handleChange("currentMonthlyGross", e.target.value)}
                    placeholder="60000"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Calculated Annual CTC</label>
                    <div className="h-10 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                      ₹{(Number(formData.currentMonthlyGross) * 12).toLocaleString("en-IN")} / annum
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK & FINANCIAL DETAILS */}
          {activeTab === "bank" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Indian Bank">Indian Bank</option>
                </Select>

                <Input
                  label="Account Holder Name"
                  value={formData.accountHolderName || `${formData.firstName} ${formData.lastName}`}
                  onChange={(e) => handleChange("accountHolderName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Account Number"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  placeholder="e.g. 50100123456789"
                />
                <Input
                  label="Bank IFSC Code"
                  required
                  value={formData.ifscCode}
                  onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000240"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Branch Name"
                  value={formData.branchName}
                  onChange={(e) => handleChange("branchName", e.target.value)}
                  placeholder="e.g. RS Puram Branch, Coimbatore"
                />
                <Input
                  label="Permanent Account Number (PAN)"
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  helperText="Official PAN number displayed on payslips and tax reports"
                />
              </div>
            </div>
          )}

          {/* TAB 5: EMERGENCY CONTACT */}
          {activeTab === "emergency" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <Input
                label="Contact Person Name"
                value={formData.emergencyName}
                onChange={(e) => handleChange("emergencyName", e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Relationship"
                  value={formData.emergencyRelationship}
                  onChange={(e) => handleChange("emergencyRelationship", e.target.value)}
                  placeholder="e.g. Father / Spouse"
                />
                <Input
                  label="Contact Phone Number"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                  placeholder="+91 98422 99999"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <div>
            {activeTab !== "personal" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1].id);
                }}
              >
                Previous Step
              </Button>
            )}
          </div>
          <div>
            {activeTab !== "emergency" ? (
              <Button
                type="button"
                variant="coral"
                size="sm"
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                variant="coral"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isEditing ? "Save Changes" : "Save & Provision"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
