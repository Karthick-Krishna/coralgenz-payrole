"use client";

import React, { useState } from "react";
import { EmployeeRequest, EmployeeRequestType, RequestStatus, Employee } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  FileCheck,
  CalendarCheck,
  Building,
  Upload,
  AlertCircle,
  Eye,
  CreditCard,
  ChevronRight,
} from "lucide-react";

interface RequestManagerProps {
  initialRequests: EmployeeRequest[];
  employees: Employee[];
}

export function RequestManager({ initialRequests, employees }: RequestManagerProps) {
  const { user, currentRole } = useAuth();
  const { success, error } = useToast();

  const [requests, setRequests] = useState<EmployeeRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal: Create New Request
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestType, setRequestType] = useState<EmployeeRequestType>("expense_claim");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);

  // Type specific payload fields
  const [expenseCategory, setExpenseCategory] = useState<"travel" | "food" | "internet" | "training" | "equipment" | "other">("travel");
  const [merchantName, setMerchantName] = useState("");
  const [repaymentMonths, setRepaymentMonths] = useState(3);
  const [letterType, setLetterType] = useState<"salary_certificate" | "bonafide" | "experience" | "relieving" | "address_proof">("salary_certificate");
  const [purpose, setPurpose] = useState("");
  const [regDate, setRegDate] = useState("2026-08-26");
  const [regCheckIn, setRegCheckIn] = useState("09:00:00");
  const [regCheckOut, setRegCheckOut] = useState("18:00:00");
  const [section80C, setSection80C] = useState(150000);
  const [section80D, setSection80D] = useState(25000);
  const [hraRent, setHraRent] = useState(20000);

  // Modal: Review Request
  const [reviewingRequest, setReviewingRequest] = useState<EmployeeRequest | null>(null);
  const [reviewerComments, setReviewerComments] = useState("");

  const refreshData = () => {
    setRequests(MockDataStore.getRequests());
  };

  const isEmployee = currentRole === "employee";
  const canApprove = currentRole === "super_admin" || currentRole === "hr_admin" || currentRole === "payroll_manager" || currentRole === "manager";

  // Filter requests
  const myEmployeeId =
    user?.employeeId ||
    employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase())?.id ||
    "CGG-EMP-0002";
  const filteredRequests = requests.filter((req) => {
    if (isEmployee || activeTab === "my_requests") {
      if (req.employeeId !== myEmployeeId && req.employeeName !== user?.displayName) return false;
    }
    if (activeTab === "pending_approvals" && req.status !== "pending" && req.status !== "under_review") {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      req.title.toLowerCase().includes(q) ||
      req.employeeName.toLowerCase().includes(q) ||
      req.employeeCode.toLowerCase().includes(q);

    const matchesType = typeFilter === "all" || req.type === typeFilter;
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  const handleOpenCreate = (type?: EmployeeRequestType) => {
    if (type) setRequestType(type);
    setTitle("");
    setDescription("");
    setAmount(undefined);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      error("Missing Information", "Please enter a title and description for your request.");
      return;
    }

    const currentEmp =
      employees.find((e) => e.id === myEmployeeId) ||
      employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase()) ||
      employees[0];

    const payload: EmployeeRequest["payload"] = {};
    if (requestType === "expense_claim") {
      payload.expenseCategory = expenseCategory;
      payload.merchantName = merchantName;
      payload.expenseDate = new Date().toISOString().split("T")[0];
    } else if (requestType === "salary_advance") {
      payload.repaymentMonths = repaymentMonths;
      payload.monthlyInstallment = amount ? Math.round(amount / repaymentMonths) : 0;
    } else if (requestType === "letter_request") {
      payload.letterType = letterType;
      payload.purpose = purpose;
    } else if (requestType === "attendance_regularization") {
      payload.regularizationDate = regDate;
      payload.suggestedCheckIn = regCheckIn;
      payload.suggestedCheckOut = regCheckOut;
    } else if (requestType === "tax_declaration") {
      payload.section80C = section80C;
      payload.section80D = section80D;
      payload.hraAnnualRent = hraRent * 12;
    }

    MockDataStore.createRequest({
      organizationId: "org-coralgenz-01",
      employeeId: currentEmp.id,
      employeeName: `${currentEmp.firstName} ${currentEmp.lastName}`,
      employeeCode: currentEmp.id,
      departmentName: currentEmp.departmentName,
      type: requestType,
      title,
      description,
      amount: amount || undefined,
      status: "pending",
      payload,
    });

    success("Request Submitted", "Your request has been submitted to HR/Finance for review.");
    setShowCreateModal(false);
    refreshData();
  };

  const handleReviewAction = (status: RequestStatus) => {
    if (!reviewingRequest) return;

    MockDataStore.updateRequestStatus(
      reviewingRequest.id,
      status,
      user?.displayName || "Reviewer",
      user?.id || "usr-01",
      reviewerComments
    );

    success(
      `Request ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated"}`,
      `Ticket ${reviewingRequest.id} has been marked as ${status}.`
    );
    setReviewingRequest(null);
    refreshData();
  };

  const statusBadgeVariant = (s: RequestStatus): "success" | "warning" | "danger" | "coral" | "secondary" => {
    switch (s) {
      case "approved":
      case "disbursed":
        return "success";
      case "pending":
        return "warning";
      case "under_review":
        return "coral";
      case "rejected":
        return "danger";
      default:
        return "secondary";
    }
  };

  const typeIcon = (t: EmployeeRequestType) => {
    switch (t) {
      case "expense_claim":
        return <Receipt className="w-4 h-4 text-emerald-500" />;
      case "salary_advance":
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case "tax_declaration":
        return <FileCheck className="w-4 h-4 text-blue-500" />;
      case "letter_request":
        return <FileText className="w-4 h-4 text-amber-500" />;
      case "attendance_regularization":
        return <Clock className="w-4 h-4 text-rose-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const totalPending = requests.filter((r) => r.status === "pending" || r.status === "under_review").length;
  const totalApproved = requests.filter((r) => r.status === "approved").length;
  const totalClaimAmount = requests
    .filter((r) => r.status === "approved" && r.amount)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const tabs = canApprove
    ? [
        { id: "all", label: `All Requests (${requests.length})`, icon: <FileText className="w-4 h-4" /> },
        { id: "pending_approvals", label: `Pending Approvals (${totalPending})`, icon: <Clock className="w-4 h-4 text-amber-500" /> },
        { id: "my_requests", label: "My Submissions", icon: <CheckCircle2 className="w-4 h-4" /> },
      ]
    : [
        { id: "my_requests", label: `My Requests (${requests.length})`, icon: <FileText className="w-4 h-4" /> },
      ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Requests & Claims
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Expense claims, advances, tax declarations, and letters
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button
            variant="coral"
            size="sm"
            onClick={() => handleOpenCreate()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Submit Request
          </Button>
        </div>
      </div>

      {/* KPI Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Tickets</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {requests.length}
              </h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase">Pending</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-500 mt-0.5">{totalPending}</h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase">Approved</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{totalApproved}</h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-purple-600 uppercase">Disbursed</p>
              <h3 className="text-base sm:text-xl font-black text-purple-600 mt-0.5 font-mono truncate max-w-[100px]">
                {formatINR(totalClaimAmount)}
              </h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <Input
              placeholder="Search title, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="text-xs"
            />

            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs">
              <option value="all">All Request Categories</option>
              <option value="expense_claim">Expense Reimbursements</option>
              <option value="salary_advance">Salary Advances / Loans</option>
              <option value="tax_declaration">Tax & IT Declarations</option>
              <option value="letter_request">Official Letters & Certificates</option>
              <option value="attendance_regularization">Attendance Regularization</option>
            </Select>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-slate-400">
              No employee requests match the selected filters.
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {typeIcon(req.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate block">
                      {req.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {req.employeeName} ({req.employeeCode})
                    </span>
                  </div>
                </div>

                <Badge variant={statusBadgeVariant(req.status)} size="sm" dot>
                  {req.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {req.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {req.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {req.amount ? formatINR(req.amount) : "—"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReviewingRequest(req);
                    setReviewerComments(req.reviewerComments || "");
                  }}
                  className="h-8 px-2.5 text-xs text-coral-600 hover:text-coral-700"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  {canApprove && (req.status === "pending" || req.status === "under_review")
                    ? "Review"
                    : "Details"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Requests Table (>= md) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title & Description</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <TableEmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title="No requests found"
                    description="No employee requests match the selected filters."
                  />
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {typeIcon(req.type)}
                      </div>
                      <span className="text-xs font-semibold capitalize">
                        {req.type.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {req.title}
                    </span>
                    <span className="text-xs text-slate-500 line-clamp-1 max-w-sm">
                      {req.description}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {req.employeeName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {req.employeeCode} • {req.departmentName}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {req.amount ? formatINR(req.amount) : "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusBadgeVariant(req.status)} size="sm" dot>
                      {req.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(req.createdAt)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReviewingRequest(req);
                        setReviewerComments(req.reviewerComments || "");
                      }}
                      className="h-8 px-2.5 text-xs text-coral-600 hover:text-coral-700"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {canApprove && (req.status === "pending" || req.status === "under_review")
                        ? "Review"
                        : "Details"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL: SUBMIT NEW REQUEST */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Submit Employee Request"
        description="Choose request type and provide necessary details"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Request Category"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as EmployeeRequestType)}
          >
            <option value="expense_claim">💳 Expense Reimbursement Claim</option>
            <option value="salary_advance">💰 Salary Advance / Loan Application</option>
            <option value="tax_declaration">📑 Tax & Investment Declaration</option>
            <option value="letter_request">📜 Official HR Letter / Certificate</option>
            <option value="attendance_regularization">⏰ Attendance Regularization</option>
          </Select>

          <Input
            label="Request Subject / Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              requestType === "expense_claim"
                ? "e.g. Travel Expenses for Client Visit"
                : requestType === "salary_advance"
                ? "e.g. Medical Emergency Salary Advance"
                : "e.g. Request Title"
            }
          />

          {/* Conditional Category Specific Fields */}
          {requestType === "expense_claim" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <Select
                label="Expense Type"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as typeof expenseCategory)}
              >
                <option value="travel">Travel & Taxi</option>
                <option value="food">Client Meals & Team Food</option>
                <option value="internet">Internet & Broadband</option>
                <option value="equipment">Hardware / Equipment</option>
                <option value="training">Training / Certification</option>
                <option value="other">Other</option>
              </Select>

              <Input
                label="Claim Amount (₹)"
                type="number"
                required
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="2499"
              />

              <Input
                label="Merchant / Vendor Name"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. Uber, Airtel, Coursera"
                className="sm:col-span-2"
              />
            </div>
          )}

          {requestType === "salary_advance" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <Input
                label="Requested Advance Amount (₹)"
                type="number"
                required
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="50000"
              />

              <Select
                label="Repayment Tenure (Months)"
                value={repaymentMonths}
                onChange={(e) => setRepaymentMonths(Number(e.target.value))}
              >
                <option value={1}>1 Month (Next Payroll)</option>
                <option value={3}>3 Months Installments</option>
                <option value={6}>6 Months Installments</option>
                <option value={12}>12 Months Installments</option>
              </Select>

              {amount && amount > 0 && (
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-xs font-semibold text-purple-900 dark:text-purple-200 flex justify-between">
                  <span>Monthly Payroll Deduction:</span>
                  <span className="font-mono font-bold">
                    {formatINR(Math.round(amount / repaymentMonths))} / month
                  </span>
                </div>
              )}
            </div>
          )}

          {requestType === "letter_request" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <Select
                label="Letter / Certificate Type"
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as typeof letterType)}
              >
                <option value="salary_certificate">Salary Certificate</option>
                <option value="bonafide">Bonafide / Employment Proof</option>
                <option value="experience">Experience Letter</option>
                <option value="address_proof">Company Address Proof Letter</option>
                <option value="relieving">Relieving Letter</option>
              </Select>

              <Input
                label="Addressed To / Bank Name"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. HDFC Bank, Visa Embassy"
              />
            </div>
          )}

          {requestType === "attendance_regularization" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
              <Input
                label="Incident Date"
                type="date"
                required
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
              />
              <Input
                label="Suggested Check-In"
                type="time"
                value={regCheckIn}
                onChange={(e) => setRegCheckIn(e.target.value)}
              />
              <Input
                label="Suggested Check-Out"
                type="time"
                value={regCheckOut}
                onChange={(e) => setRegCheckOut(e.target.value)}
              />
            </div>
          )}

          {requestType === "tax_declaration" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Input
                label="Section 80C (PPF/ELSS ₹)"
                type="number"
                value={section80C}
                onChange={(e) => setSection80C(Number(e.target.value))}
              />
              <Input
                label="Section 80D (Mediclaim ₹)"
                type="number"
                value={section80D}
                onChange={(e) => setSection80D(Number(e.target.value))}
              />
              <Input
                label="Monthly House Rent (₹)"
                type="number"
                value={hraRent}
                onChange={(e) => setHraRent(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Reason / Detailed Explanation
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, justifications, or invoice numbers..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REVIEW REQUEST (FOR HR / MANAGEMENT / DETAILS) */}
      <Modal
        isOpen={Boolean(reviewingRequest)}
        onClose={() => setReviewingRequest(null)}
        title="Request Decision & Details"
        description={`Ticket: ${reviewingRequest?.id} • Submitted by ${reviewingRequest?.employeeName}`}
        maxWidth="md"
      >
        {reviewingRequest && (
          <div className="space-y-4 text-xs">
            {/* Header info card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {typeIcon(reviewingRequest.type)}
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {reviewingRequest.title}
                  </span>
                </div>
                <Badge variant={statusBadgeVariant(reviewingRequest.status)} size="sm">
                  {reviewingRequest.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {reviewingRequest.description}
              </p>

              {reviewingRequest.amount && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold">
                  <span>Requested Amount:</span>
                  <span className="font-mono text-coral-600 dark:text-coral-400 text-sm">
                    {formatINR(reviewingRequest.amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Decision History */}
            {reviewingRequest.reviewerName && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
                <p>
                  Reviewed by <span className="font-bold">{reviewingRequest.reviewerName}</span> on{" "}
                  {formatDate(reviewingRequest.reviewedAt)}
                </p>
                {reviewingRequest.reviewerComments && (
                  <p className="italic text-slate-500">&ldquo;{reviewingRequest.reviewerComments}&rdquo;</p>
                )}
              </div>
            )}

            {/* Review actions if pending and user can approve */}
            {canApprove && (reviewingRequest.status === "pending" || reviewingRequest.status === "under_review") ? (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Reviewer Decision Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    placeholder="Enter approval note or rejection reason..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingRequest(null)}
                    className="order-3 sm:order-1"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleReviewAction("rejected")}
                    leftIcon={<XCircle className="w-4 h-4" />}
                    className="order-2"
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="coral"
                    size="sm"
                    onClick={() => handleReviewAction("approved")}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="order-1 sm:order-3"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingRequest(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
