"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Employee, Department, Designation, EmployeeDocument } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  formatINR,
  formatDate,
  maskAccountNumber,
  getInitials,
} from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  FileText,
  TrendingUp,
  History,
  Clock,
  ShieldCheck,
  Edit,
  Upload,
  Download,
  Trash2,
  DollarSign,
  UserMinus,
  CheckCircle2,
} from "lucide-react";

interface EmployeeProfileProps {
  employee: Employee;
  department?: Department;
  designation?: Designation;
  onRefresh?: () => void;
}

export function EmployeeProfile({
  employee,
  department,
  designation,
  onRefresh,
}: EmployeeProfileProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Salary Revision Form State
  const [newSalary, setNewSalary] = useState(employee.currentMonthlyGross);
  const [revisionReason, setRevisionReason] = useState("Annual Performance Review");
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split("T")[0]);

  // Document Upload Form State
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<EmployeeDocument["type"]>("identity_proof");

  // Exit / Settlement State
  const [resignationDate, setResignationDate] = useState(new Date().toISOString().split("T")[0]);
  const [lastDay, setLastDay] = useState(new Date().toISOString().split("T")[0]);
  const [exitReason, setExitReason] = useState("Career Growth / Better Opportunity");

  const handleSalaryRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSalary <= 0) {
      error("Invalid Salary", "Please enter a valid monthly salary amount.");
      return;
    }

    const revision = {
      id: `rev-${Date.now()}`,
      previousSalary: employee.currentMonthlyGross,
      newSalary: Number(newSalary),
      effectiveDate: revisionDate,
      reason: revisionReason,
      changedBy: "usr-superadmin-01",
      changedByName: "Super Admin",
      timestamp: new Date().toISOString(),
    };

    const updatedRevisions = [revision, ...(employee.salaryRevisions || [])];

    MockDataStore.updateEmployee(employee.id, {
      currentMonthlyGross: Number(newSalary),
      currentAnnualCtc: Number(newSalary) * 12,
      salaryRevisions: updatedRevisions,
    });

    MockDataStore.logAudit({
      userId: "usr-superadmin-01",
      userName: "Super Admin",
      userRole: "super_admin",
      action: "revise_salary",
      module: "employee",
      recordId: employee.id,
      recordTitle: `${employee.firstName} ${employee.lastName}`,
      details: `Revised monthly salary for ${employee.firstName} ${employee.lastName} from ${formatINR(employee.currentMonthlyGross)} to ${formatINR(newSalary)} (${revisionReason})`,
    });

    success("Salary Revised", `Successfully updated salary to ${formatINR(newSalary)}`);
    setShowRevisionModal(false);
    if (onRefresh) onRefresh();
  };

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) {
      error("Document Name Required", "Please enter a name for the document.");
      return;
    }

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      name: docName,
      type: docType,
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileName: `${docName.replace(/\s+/g, "_")}.pdf`,
      fileSize: 145000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "HR Admin",
    };

    const updatedDocs = [newDoc, ...(employee.documents || [])];
    MockDataStore.updateEmployee(employee.id, { documents: updatedDocs });

    success("Document Uploaded", `Added ${docName} to employee records.`);
    setDocName("");
    setShowDocModal(false);
    if (onRefresh) onRefresh();
  };

  const handleExitSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate final settlement
    const dailyRate = employee.currentMonthlyGross / 22;
    const leaveEncashment = Math.round(dailyRate * 5); // 5 days unused
    const pendingSalary = Math.round(dailyRate * 15);
    const totalSettlement = pendingSalary + leaveEncashment;

    MockDataStore.updateEmployee(employee.id, {
      status: "resigned",
      exitInfo: {
        resignationDate,
        lastWorkingDay: lastDay,
        exitReason,
        noticePeriodDays: 30,
        exitStatus: "approved",
        settlementAmount: totalSettlement,
        settlementNotes: `Pending Days (15d): ${formatINR(pendingSalary)}, Leave Encashment (5d): ${formatINR(leaveEncashment)}`,
        settledAt: new Date().toISOString(),
        settledBy: "Super Admin",
      },
    });

    success("Exit Processed", `Recorded resignation and calculated final settlement of ${formatINR(totalSettlement)}`);
    setShowExitModal(false);
    if (onRefresh) onRefresh();
  };

  const tabs = [
    { id: "overview", label: "Overview & Personal", icon: <User className="w-4 h-4" /> },
    { id: "financial", label: "Financial & Compensation", icon: <CreditCard className="w-4 h-4" /> },
    { id: "documents", label: `Documents (${employee.documents?.length || 0})`, icon: <FileText className="w-4 h-4" /> },
    { id: "salary_history", label: `Salary Revisions (${employee.salaryRevisions?.length || 0})`, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header Hero Card */}
      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-coral-900 relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-coral-500 to-amber-500 text-white font-bold text-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl shrink-0">
                {getInitials(`${employee.firstName} ${employee.lastName}`)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <Badge variant="coral" size="sm">
                    {employee.id}
                  </Badge>
                  <Badge
                    variant={employee.status === "active" ? "success" : "warning"}
                    size="sm"
                    dot
                  >
                    {employee.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {employee.designationTitle} • {employee.departmentName} • Joined {formatDate(employee.joiningDate)}
                </p>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionModal(true)}
                leftIcon={<DollarSign className="w-4 h-4 text-emerald-500" />}
              >
                Revise Salary
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocModal(true)}
                leftIcon={<Upload className="w-4 h-4 text-blue-500" />}
              >
                Upload Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitModal(true)}
                leftIcon={<UserMinus className="w-4 h-4 text-rose-500" />}
              >
                Offboard / Exit
              </Button>
              <Button
                variant="coral"
                size="sm"
                onClick={() => router.push(`/employees/new?editId=${employee.id}`)}
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW & PERSONAL */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Personal & Contact Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Official Work Email</span>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Personal Email</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {employee.personalEmail || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Phone Number</span>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {employee.phone}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Date of Birth / Gender</span>
                <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {formatDate(employee.dateOfBirth)} ({employee.gender})
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Residential Address</span>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  {employee.address}, {employee.city}, {employee.state}, {employee.country} - {employee.postalCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact & Manager Link */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Contact Name</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {employee.emergencyContact?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Relationship</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {employee.emergencyContact?.relationship || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Emergency Phone</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {employee.emergencyContact?.phone || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Work Location:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{employee.workLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Employment Type:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                    {employee.employmentType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reporting Manager:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {employee.managerName || "Top Level Executive"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL & COMPENSATION */}
      {activeTab === "financial" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* CTC and Salary Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Compensation & Statutory Breakdown (INR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-coral-700 dark:text-coral-300 uppercase tracking-wider">
                    Monthly Gross Salary
                  </span>
                  <div className="text-2xl font-black text-coral-600 dark:text-coral-400">
                    {formatINR(employee.currentMonthlyGross)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Annual CTC
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(employee.currentAnnualCtc)}
                  </div>
                </div>
              </div>

              {/* Monthly Component Estimates */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider">
                  Standard Earnings Breakdown:
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-400">Basic Salary (50%)</span>
                    <span className="font-mono font-semibold">{formatINR(employee.currentMonthlyGross * 0.5)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA - 40% of Basic)</span>
                    <span className="font-mono font-semibold">{formatINR(employee.currentMonthlyGross * 0.2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-400">Conveyance Allowance</span>
                    <span className="font-mono font-semibold">{formatINR(1600)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-400">Medical Allowance</span>
                    <span className="font-mono font-semibold">{formatINR(1250)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-400">Special Allowance (Balancing figure)</span>
                    <span className="font-mono font-semibold">
                      {formatINR(
                        Math.max(
                          0,
                          employee.currentMonthlyGross -
                            (employee.currentMonthlyGross * 0.7 + 2850)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Masked Bank Account */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Disbursement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
                  <span>Salary Account</span>
                  <span>{employee.bankDetails?.bankName || "HDFC Bank"}</span>
                </div>
                <div className="font-mono text-base font-bold tracking-widest text-white">
                  {maskAccountNumber(employee.bankDetails?.accountNumber)}
                </div>
                <div className="flex justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Holder</span>
                    <span>{employee.bankDetails?.accountHolderName || `${employee.firstName} ${employee.lastName}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">IFSC</span>
                    <span className="font-mono">{employee.bankDetails?.ifscCode || "HDFC0000240"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-500 text-[11px]">
                <p>• Branch: {employee.bankDetails?.branchName || "Main Branch"}</p>
                <p>• Account Type: Salary Account (Automated NEFT/IMPS)</p>
                <p>• Sensitive banking numbers masked according to ISO/IEC 27001 data privacy standards.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === "documents" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Uploaded Employee Documents</CardTitle>
              <p className="text-xs text-slate-500">Official employment files and identity proofs</p>
            </div>
            <Button
              variant="coral"
              size="sm"
              onClick={() => setShowDocModal(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload Document
            </Button>
          </CardHeader>
          <CardContent>
            {!employee.documents || employee.documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p>No documents uploaded yet for this employee.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocModal(true)}
                >
                  Upload First Document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employee.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-coral-100 dark:bg-coral-950 text-coral-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {doc.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 uppercase font-mono">
                          {doc.type.replace("_", " ")} • {Math.round(doc.fileSize / 1024)} KB
                        </p>
                        <span className="text-[10px] text-slate-500">
                          Uploaded {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-slate-500 hover:text-coral-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SALARY REVISIONS TIMELINE */}
      {activeTab === "salary_history" && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Salary Revisions & Promotion History</CardTitle>
              <p className="text-xs text-slate-500">Historical record of all CTC appraisals</p>
            </div>
            <Button
              variant="coral"
              size="sm"
              onClick={() => setShowRevisionModal(true)}
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              Add New Salary Revision
            </Button>
          </CardHeader>
          <CardContent>
            {!employee.salaryRevisions || employee.salaryRevisions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No previous salary revisions recorded. Employee is on joining salary.
              </div>
            ) : (
              <div className="space-y-4">
                {employee.salaryRevisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rev.reason}
                        </span>
                        <Badge variant="success" size="sm">
                          Effective: {formatDate(rev.effectiveDate)}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                        {formatINR(rev.previousSalary)} &rarr;{" "}
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(rev.newSalary)}
                        </span>
                        <span className="text-slate-400 ml-2 font-sans text-[11px]">
                          (+{Math.round(((rev.newSalary - rev.previousSalary) / rev.previousSalary) * 100)}% hike)
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      Approved by {rev.changedByName}
                      <p>{formatDate(rev.timestamp, "dd MMM yyyy, hh:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL: SALARY REVISION */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Revise Employee Salary"
        description={`Update compensation profile for ${employee.firstName} ${employee.lastName}`}
      >
        <form onSubmit={handleSalaryRevisionSubmit} className="space-y-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex justify-between">
            <span className="text-slate-500">Current Monthly Gross:</span>
            <span className="font-bold">{formatINR(employee.currentMonthlyGross)}</span>
          </div>

          <Input
            label="New Monthly Gross Salary (₹)"
            type="number"
            required
            value={newSalary}
            onChange={(e) => setNewSalary(Number(e.target.value))}
            helperText={`Annual CTC: ₹${(Number(newSalary) * 12).toLocaleString("en-IN")}`}
          />

          <Input
            label="Effective Date"
            type="date"
            required
            value={revisionDate}
            onChange={(e) => setRevisionDate(e.target.value)}
          />

          <Input
            label="Reason for Revision"
            required
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            placeholder="e.g. Annual Appraisal 2026, Promotion, Market Correction"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRevisionModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Save Revision & Log Audit
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPLOAD DOCUMENT */}
      <Modal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        title="Upload Employee Document"
        description="Add identity proof, agreement, or educational certificate"
      >
        <form onSubmit={handleDocUpload} className="space-y-4">
          <Input
            label="Document Title"
            required
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Aadhaar Card, Offer Letter, Degree Certificate"
          />

          <Select
            label="Document Category"
            value={docType}
            onChange={(e) => setDocType(e.target.value as EmployeeDocument["type"])}
          >
            <option value="identity_proof">Identity Proof (Aadhaar/PAN/Passport)</option>
            <option value="address_proof">Address Proof</option>
            <option value="offer_letter">Offer Letter</option>
            <option value="employment_agreement">Employment Agreement</option>
            <option value="educational_certificate">Educational Certificate</option>
            <option value="bank_document">Bank Document / Cancelled Cheque</option>
            <option value="other">Other Document</option>
          </Select>

          <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-1">
            <Upload className="w-6 h-6 mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag and drop file, or click to browse
            </p>
            <p className="text-[10px] text-slate-400">PDF, PNG, JPEG up to 10MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Confirm Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: OFFBOARDING & FINAL SETTLEMENT */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Employee Exit & Settlement"
        description={`Record resignation & compute final settlement for ${employee.firstName} ${employee.lastName}`}
      >
        <form onSubmit={handleExitSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Resignation Date"
              type="date"
              required
              value={resignationDate}
              onChange={(e) => setResignationDate(e.target.value)}
            />
            <Input
              label="Last Working Day"
              type="date"
              required
              value={lastDay}
              onChange={(e) => setLastDay(e.target.value)}
            />
          </div>

          <Input
            label="Exit Reason"
            required
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            placeholder="e.g. Higher studies, Personal reasons, Relocation"
          />

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
            <h5 className="font-bold text-amber-800 dark:text-amber-300 uppercase text-[10px]">
              Final Settlement Estimation:
            </h5>
            <p>• Pending Pro-rata Salary (15 days): {formatINR((employee.currentMonthlyGross / 22) * 15)}</p>
            <p>• Unused Leave Encashment (5 days): {formatINR((employee.currentMonthlyGross / 22) * 5)}</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-amber-200 dark:border-amber-800">
              Estimated Net Settlement: {formatINR((employee.currentMonthlyGross / 22) * 20)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExitModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm">
              Confirm Resignation & Settle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
