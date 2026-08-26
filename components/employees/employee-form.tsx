"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Employee, Department, Designation, EmploymentType, EmployeeStatus } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Briefcase,
  CreditCard,
  PhoneCall,
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";

interface EmployeeFormProps {
  initialData?: Employee;
  departments: Department[];
  designations: Designation[];
  allEmployees: Employee[];
  isEditing?: boolean;
}

export function EmployeeForm({
  initialData,
  departments,
  designations,
  allEmployees,
  isEditing = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    personalEmail: initialData?.personalEmail || "",
    phone: initialData?.phone || "",
    dateOfBirth: initialData?.dateOfBirth || "1995-01-01",
    gender: initialData?.gender || ("male" as const),
    avatarUrl: initialData?.avatarUrl || "",
    address: initialData?.address || "",
    city: initialData?.city || "Bengaluru",
    state: initialData?.state || "Karnataka",
    country: initialData?.country || "India",
    postalCode: initialData?.postalCode || "560103",

    // Employment
    joiningDate: initialData?.joiningDate || new Date().toISOString().split("T")[0],
    departmentId: initialData?.departmentId || departments[0]?.id || "dept-01",
    designationId: initialData?.designationId || designations[0]?.id || "desig-01",
    managerId: initialData?.managerId || "",
    employmentType: initialData?.employmentType || ("full_time" as EmploymentType),
    status: initialData?.status || ("active" as EmployeeStatus),
    workLocation: initialData?.workLocation || "Bengaluru HQ",
    currentMonthlyGross: initialData?.currentMonthlyGross || 75000,

    // Bank
    bankName: initialData?.bankDetails?.bankName || "HDFC Bank",
    accountHolderName: initialData?.bankDetails?.accountHolderName || "",
    accountNumber: initialData?.bankDetails?.accountNumber || "",
    ifscCode: initialData?.bankDetails?.ifscCode || "HDFC0000240",
    branchName: initialData?.bankDetails?.branchName || "Main Branch",

    // Emergency Contact
    emergencyName: initialData?.emergencyContact?.name || "",
    emergencyRelationship: initialData?.emergencyContact?.relationship || "Parent",
    emergencyPhone: initialData?.emergencyContact?.phone || "",
  });

  const handleChange = (
    field: string,
    value: unknown
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    const validDesig = designations.find((d) => d.departmentId === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      designationId: validDesig ? validDesig.id : prev.designationId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      error("Missing Fields", "Please complete all required fields in the personal information tab.");
      setActiveTab("personal");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDept = departments.find((d) => d.id === formData.departmentId);
      const selectedDesig = designations.find((d) => d.id === formData.designationId);
      const selectedManager = allEmployees.find((e) => e.id === formData.managerId);

      const payload = {
        organizationId: "org-coralgenz-01",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        personalEmail: formData.personalEmail,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as "male" | "female" | "other",
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        joiningDate: formData.joiningDate,
        departmentId: formData.departmentId,
        departmentName: selectedDept?.name || "General",
        designationId: formData.designationId,
        designationTitle: selectedDesig?.title || "Associate",
        managerId: formData.managerId || undefined,
        managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : undefined,
        employmentType: formData.employmentType,
        status: formData.status,
        workLocation: formData.workLocation,
        currentMonthlyGross: Number(formData.currentMonthlyGross),
        currentAnnualCtc: Number(formData.currentMonthlyGross) * 12,
        salaryRevisions: initialData?.salaryRevisions || [],
        bankDetails: {
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName || `${formData.firstName} ${formData.lastName}`,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branchName: formData.branchName,
          accountType: "salary" as const,
        },
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone,
        },
        documents: initialData?.documents || [],
      };

      if (isEditing && initialData) {
        MockDataStore.updateEmployee(initialData.id, payload);
        success("Profile Updated", `Updated employee details for ${formData.firstName} ${formData.lastName}`);
        router.push(`/employees/${initialData.id}`);
      } else {
        const newEmp = MockDataStore.addEmployee(payload);
        success("Employee Created", `Added ${newEmp.firstName} ${newEmp.lastName} (${newEmp.id}) to employee directory.`);
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
    { id: "employment", label: "Employment & Salary", icon: <Briefcase className="w-4 h-4" /> },
    { id: "bank", label: "Bank & Financial Details", icon: <CreditCard className="w-4 h-4" /> },
    { id: "emergency", label: "Emergency Contact", icon: <PhoneCall className="w-4 h-4" /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEditing ? `Edit Employee: ${initialData?.firstName} ${initialData?.lastName}` : "Onboard New Employee"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditing ? `Employee ID: ${initialData?.id}` : "Step-by-step employee profile creation"}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="coral"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditing ? "Save Changes" : "Save & Create Employee"}
        </Button>
      </div>

      {/* Tabs Switcher */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </CardHeader>

        <CardContent className="p-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Profile Photo Picker */}
              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-sky-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Profile Photo URL / Link"
                      value={formData.avatarUrl}
                      onChange={(e) => handleChange("avatarUrl", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Or select a corporate portrait preset:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Portrait 1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
                      { name: "Portrait 2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
                      { name: "Portrait 3", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80" },
                      { name: "Portrait 4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" },
                      { name: "Portrait 5", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80" },
                      { name: "Portrait 6", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80" },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChange("avatarUrl", p.url)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          formData.avatarUrl === p.url ? "border-sky-500 ring-2 ring-sky-300 shadow-md" : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange("avatarUrl", "")}
                        className="px-2.5 py-1 text-xs text-rose-500 hover:underline font-semibold"
                      >
                        Clear Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="e.g. Aarav"
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
                  label="Official Work Email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="aarav.kumar@coralgenz.com"
                />
                <Input
                  label="Personal Email"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleChange("personalEmail", e.target.value)}
                  placeholder="aarav.personal@gmail.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Contact Phone"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  required
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
              </div>

              <Input
                label="Residential Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Apartment / Building / Street address"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
                <Input
                  label="PIN / Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT & SALARY */}
          {activeTab === "employment" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of Joining"
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => handleChange("joiningDate", e.target.value)}
                />
                <Select
                  label="Department"
                  required
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Designation"
                  required
                  value={formData.designationId}
                  onChange={(e) => handleChange("designationId", e.target.value)}
                >
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.title}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Reporting Manager"
                  value={formData.managerId}
                  onChange={(e) => handleChange("managerId", e.target.value)}
                >
                  <option value="">No Direct Manager (Top Level)</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.designationTitle})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  label="Employment Status"
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="on_leave">On Leave</option>
                  <option value="resigned">Resigned</option>
                  <option value="inactive">Inactive</option>
                </Select>

                <Input
                  label="Work Location"
                  value={formData.workLocation}
                  onChange={(e) => handleChange("workLocation", e.target.value)}
                  placeholder="e.g. Bengaluru HQ / Remote"
                />
              </div>

              <div className="p-4 rounded-2xl bg-coral-50/50 dark:bg-coral-950/20 border border-coral-200 dark:border-coral-800/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-coral-700 dark:text-coral-300">
                  Compensation (INR)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Gross Salary (₹)"
                    type="number"
                    required
                    value={formData.currentMonthlyGross}
                    onChange={(e) => handleChange("currentMonthlyGross", Number(e.target.value))}
                    helperText={`Annual CTC: ₹${(Number(formData.currentMonthlyGross) * 12).toLocaleString("en-IN")}`}
                  />
                  <div className="flex flex-col justify-center space-y-1">
                    <span className="text-xs text-slate-500">
                      Standard Indian IT Structure applies:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • 50% Basic Salary • 40% HRA • 12% PF Match • PT & TDS Slabs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANK & FINANCIALS */}
          {activeTab === "bank" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  required
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                />
                <Input
                  label="Account Holder Name"
                  required
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

              <Input
                label="Branch Name"
                value={formData.branchName}
                onChange={(e) => handleChange("branchName", e.target.value)}
                placeholder="e.g. Indiranagar Branch, Bengaluru"
              />
            </div>
          )}

          {/* TAB 4: EMERGENCY CONTACT */}
          {activeTab === "emergency" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Emergency Contact Name"
                  value={formData.emergencyName}
                  onChange={(e) => handleChange("emergencyName", e.target.value)}
                  placeholder="e.g. Priya Kumar"
                />
                <Select
                  label="Relationship"
                  value={formData.emergencyRelationship}
                  onChange={(e) => handleChange("emergencyRelationship", e.target.value)}
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </Select>
                <Input
                  label="Emergency Phone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                  placeholder="+91 98765 00000"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-2">
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
            {activeTab !== "emergency" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="coral"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
          >
            {isEditing ? "Save Changes" : "Create Employee"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
