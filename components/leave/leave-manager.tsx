"use client";

import React, { useState, useEffect } from "react";
import { LeaveRequest, LeaveBalance, Employee } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  FileText,
} from "lucide-react";

interface LeaveManagerProps {
  initialLeaveRequests: LeaveRequest[];
  initialBalances: LeaveBalance[];
  employees: Employee[];
}

export function LeaveManager({
  initialLeaveRequests,
  initialBalances,
  employees,
}: LeaveManagerProps) {
  const { user, currentRole } = useAuth();
  const { success, error } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [balances, setBalances] = useState<LeaveBalance[]>(initialBalances);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Apply Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    user?.employeeId || employees[0]?.id || "CGG-EMP-0002"
  );
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("casual");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState(1);
  const [leaveReason, setLeaveReason] = useState("");

  const refreshData = () => {
    setRequests(MockDataStore.getLeaveRequests());
    setBalances(MockDataStore.getLeaveBalances());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("coralgenz_store_updated", refreshData);
    return () => window.removeEventListener("coralgenz_store_updated", refreshData);
  }, []);

  // Compute days count when dates change
  useEffect(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays);
    } catch {
      setDaysCount(1);
    }
  }, [startDate, endDate]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      error("Reason Required", "Please provide a reason for the leave application.");
      return;
    }

    const targetEmpId = currentRole === "employee" ? myEmpId : selectedEmployeeId;
    const emp =
      employees.find((e) => e.id === targetEmpId) ||
      employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase()) ||
      employees[0];

    MockDataStore.submitLeaveRequest({
      organizationId: "org-coralgenz-01",
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentName: emp.departmentName,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason: leaveReason,
      managerId: emp.managerId,
    });

    success("Leave Submitted", `Application for ${daysCount} days ${leaveType} leave has been submitted.`);
    setShowApplyModal(false);
    setLeaveReason("");
    refreshData();
  };

  const handleApprove = (reqId: string) => {
    MockDataStore.updateLeaveStatus(
      reqId,
      "approved",
      user?.id || "usr-hr-01",
      user?.displayName || "HR Admin",
      "Approved by HR/Manager"
    );
    success("Leave Approved", "The employee's leave balance has been updated.");
    refreshData();
  };

  const handleReject = (reqId: string) => {
    MockDataStore.updateLeaveStatus(
      reqId,
      "rejected",
      user?.id || "usr-hr-01",
      user?.displayName || "HR Admin",
      "Rejected per company policy"
    );
    success("Leave Rejected", "The request status was updated.");
    refreshData();
  };

  const myEmpId =
    user?.employeeId ||
    employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase())?.id ||
    "CGG-EMP-0002";
  const isEmployee = currentRole === "employee";

  const filteredRequests = requests.filter((r) => {
    if (isEmployee) {
      if (r.employeeId !== myEmpId && r.employeeName !== user?.displayName) return false;
    }
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  // Current user's leave balance
  const currentBalance =
    balances.find((b) => b.employeeId === myEmpId) ||
    balances[0];

  const statusVariants: Record<LeaveRequest["status"], { variant: "success" | "warning" | "danger" | "secondary"; label: string }> = {
    pending: { variant: "warning", label: "Pending" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "danger", label: "Rejected" },
    cancelled: { variant: "secondary", label: "Cancelled" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Apply for leave, track annual quotas, and manage team approvals.
          </p>
        </div>

        <Button
          variant="coral"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balance Quotas Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card hoverEffect>
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Casual Leave</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.casual?.remaining ?? 9}
            </div>
            <span className="text-[10px] text-slate-500">
              Used: {currentBalance?.casual?.used ?? 3} / {currentBalance?.casual?.allocated ?? 12}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sick Leave</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.sick?.remaining ?? 9}
            </div>
            <span className="text-[10px] text-slate-500">
              Used: {currentBalance?.sick?.used ?? 1} / {currentBalance?.sick?.allocated ?? 10}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Leave</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.annual?.remaining ?? 11}
            </div>
            <span className="text-[10px] text-slate-500">
              Used: {currentBalance?.annual?.used ?? 4} / {currentBalance?.annual?.allocated ?? 15}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Earned Leave</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.earned?.remaining ?? 8}
            </div>
            <span className="text-[10px] text-slate-500">
              Used: {currentBalance?.earned?.used ?? 2} / {currentBalance?.earned?.allocated ?? 10}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leave Applications</CardTitle>
          <Select
            className="w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Requests ({requests.length})</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <TableEmptyState
                      icon={<CalendarCheck className="w-8 h-8" />}
                      title="No leave requests found"
                      description="No records matched the selected status filter."
                    />
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {req.employeeName}
                      </span>
                      <span className="text-[11px] text-slate-400">{req.departmentName}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="coral" size="sm" className="capitalize">
                        {req.leaveType}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-xs">{req.daysCount} d</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate block">
                        {req.reason}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={statusVariants[req.status]?.variant || "secondary"}
                        size="sm"
                        dot
                      >
                        {statusVariants[req.status]?.label || req.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {req.status === "pending" && currentRole !== "employee" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="h-7 px-2 text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(req.id)}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {req.reviewerName ? `By ${req.reviewerName}` : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: APPLY LEAVE */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
        description="Submit leave application for manager / HR review"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          {currentRole !== "employee" && (
            <Select
              label="Select Employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.id})
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveRequest["leaveType"])}
          >
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="annual">Annual Leave</option>
            <option value="earned">Earned Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="unpaid">Unpaid Leave (Loss of Pay)</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex justify-between font-semibold">
            <span>Total Leave Duration:</span>
            <span className="text-coral-600 dark:text-coral-400">{daysCount} Days</span>
          </div>

          <Input
            label="Reason for Leave"
            required
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="e.g. Family function, medical consultation, personal travel"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Submit Leave Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
