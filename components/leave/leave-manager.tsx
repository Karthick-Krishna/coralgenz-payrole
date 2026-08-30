"use client";

import React, { useState, useEffect } from "react";
import { LeaveRequest, LeaveBalance, Employee } from "@/types";
import { LeaveService } from "@/lib/firebase/leave-service";
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
  Calendar,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface LeaveManagerProps {
  initialLeaveRequests: LeaveRequest[];
  initialBalances: LeaveBalance[];
  employees: Employee[];
  onRefresh?: () => void;
}

export function LeaveManager({
  initialLeaveRequests,
  initialBalances,
  employees,
  onRefresh,
}: LeaveManagerProps) {
  const { user, currentRole, isSuperAdmin } = useAuth();
  const { success, error } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [balances, setBalances] = useState<LeaveBalance[]>(initialBalances);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Deletion modal state
  const [deletingLeave, setDeletingLeave] = useState<LeaveRequest | null>(null);
  const [isDeletingLeave, setIsDeletingLeave] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  // Apply Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    user?.employeeId || employees[0]?.id || "CGG-EMP-0001"
  );
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("casual");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState(1);
  const [leaveReason, setLeaveReason] = useState("");

  const myEmpId =
    user?.employeeId ||
    employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase())?.id ||
    "CGG-EMP-0001";
  const isEmployee = currentRole === "employee";
  const canApprove = currentRole === "super_admin" || currentRole === "hr_admin" || currentRole === "manager";

  useEffect(() => {
    setRequests(initialLeaveRequests);
    setBalances(initialBalances);
  }, [initialLeaveRequests, initialBalances]);

  const refreshData = async () => {
    try {
      const data = await LeaveService.getLeaves(isEmployee ? myEmpId : undefined);
      setRequests(data.requests);
      if (data.balance) {
        setBalances((prev) => {
          const others = prev.filter((b) => b.employeeId !== data.balance?.employeeId);
          return [data.balance!, ...others];
        });
      }
    } catch (err) {
      console.error("Failed to refresh leave data", err);
    }
  };

  useEffect(() => {
    refreshData();
    const handleStoreUpdate = () => refreshData();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, [myEmpId]);

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

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      error("Reason Required", "Please provide a reason for the leave application.");
      return;
    }

    const targetEmpId = isEmployee ? myEmpId : selectedEmployeeId;
    const emp =
      employees.find((e) => e.id === targetEmpId) ||
      employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase()) ||
      employees[0] || ({ id: targetEmpId, firstName: "Employee", lastName: "", departmentName: "General" });

    await LeaveService.submitLeaveRequest({
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

  const handleApprove = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(
      reqId,
      "approved",
      "Approved by HR/Manager"
    );
    success("Leave Approved", "The employee's leave balance has been updated.");
    refreshData();
  };

  const handleReject = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(
      reqId,
      "rejected",
      "Rejected per company policy"
    );
    success("Leave Rejected", "The request status was updated.");
    refreshData();
  };

  const handleConfirmDeleteLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingLeave) return;
    setIsDeletingLeave(true);
    try {
      const res = await LeaveService.deleteLeaveRequest(
        deletingLeave.id,
        {
          id: user?.id || "usr-admin",
          name: user?.displayName || "Admin",
          role: currentRole,
        },
        deleteReason.trim() || `Deleted leave application ${deletingLeave.id}`
      );
      if (res) {
        success("Leave Application Deleted", "Permanently removed leave record from the server.");
        setDeletingLeave(null);
        refreshData();
        onRefresh?.();
      } else {
        error("Delete Failed", "Could not remove leave application from the server.");
      }
    } catch (err: any) {
      error("Error", err.message || "Failed to delete leave application.");
    } finally {
      setIsDeletingLeave(false);
    }
  };

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

  const canDeleteLeave = (req: LeaveRequest) => {
    return isSuperAdmin || canApprove || (req.employeeId === myEmpId && req.status === "pending");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apply for leave, track annual quotas, and manage team approvals
          </p>
        </div>

        <Button
          variant="coral"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto text-xs"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balance Quotas Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Casual</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.casual?.remaining ?? 9}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Used: {currentBalance?.casual?.used ?? 3}/{currentBalance?.casual?.allocated ?? 12}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Sick</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.sick?.remaining ?? 9}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Used: {currentBalance?.sick?.used ?? 1}/{currentBalance?.sick?.allocated ?? 10}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Annual</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.annual?.remaining ?? 11}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Used: {currentBalance?.annual?.used ?? 4}/{currentBalance?.annual?.allocated ?? 15}
            </span>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Earned</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {currentBalance?.earned?.remaining ?? 8}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Used: {currentBalance?.earned?.used ?? 2}/{currentBalance?.earned?.allocated ?? 10}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 self-start sm:self-center">
            Leave Applications
          </span>
          <Select
            className="w-full sm:w-48 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Requests ({requests.length})</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </CardContent>
      </Card>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-slate-400">
              No leave requests found for the selected filter.
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                    {req.employeeName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="coral" size="sm" className="capitalize">
                      {req.leaveType}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-bold">{req.daysCount} Days</span>
                  </div>
                </div>

                <Badge
                  variant={statusVariants[req.status]?.variant || "secondary"}
                  size="sm"
                  dot
                >
                  {statusVariants[req.status]?.label || req.status}
                </Badge>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Duration:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                  </span>
                </div>
                {req.reason && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs italic pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    &ldquo;{req.reason}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {canApprove && req.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 flex-1"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      className="h-8 text-xs flex-1"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
                {canDeleteLeave(req) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteReason("");
                      setDeletingLeave(req);
                    }}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                    title="Delete Leave Application"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Leave Table (>= md) */}
      <div className="hidden md:block">
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
                    <div className="flex items-center justify-end gap-1.5">
                      {canApprove && req.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Approve Request"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(req.id)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {canDeleteLeave(req) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteReason("");
                            setDeletingLeave(req);
                          }}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Leave Application from Server"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!canApprove && !canDeleteLeave(req) && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
        description="Submit a leave application for manager approval"
        maxWidth="md"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          {!isEmployee && (
            <Select
              label="Select Employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.departmentName})
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveRequest["leaveType"])}
          >
            <option value="casual">Casual Leave ({currentBalance?.casual?.remaining ?? 9} remaining)</option>
            <option value="sick">Sick Leave ({currentBalance?.sick?.remaining ?? 9} remaining)</option>
            <option value="annual">Annual Leave ({currentBalance?.annual?.remaining ?? 11} remaining)</option>
            <option value="earned">Earned Leave ({currentBalance?.earned?.remaining ?? 8} remaining)</option>
            <option value="unpaid">Loss of Pay / Unpaid</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Duration:</span>
            <span className="font-bold text-coral-600 dark:text-coral-400 font-mono text-sm">
              {daysCount} {daysCount === 1 ? "Day" : "Days"}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Leave
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs focus:ring-1 focus:ring-coral-500 focus:outline-none"
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Personal family event, medical appointment, fever..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Submit Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Leave Confirmation Modal */}
      <Modal
        isOpen={!!deletingLeave}
        onClose={() => setDeletingLeave(null)}
        title={`Delete Leave Application`}
        description="Permanently delete this leave record from Google Cloud Firestore"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDeleteLeave} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Permanent Server Deletion</p>
              <p>
                You are about to delete the leave application for{" "}
                <strong>{deletingLeave?.employeeName}</strong> (
                {deletingLeave?.leaveType?.toUpperCase()} Leave,{" "}
                {deletingLeave?.daysCount}{" "}
                {deletingLeave?.daysCount === 1 ? "day" : "days"}).
              </p>
              <p>
                Duration:{" "}
                <span className="font-semibold">
                  {deletingLeave ? formatDate(deletingLeave.startDate) : ""} &rarr;{" "}
                  {deletingLeave ? formatDate(deletingLeave.endDate) : ""}
                </span>
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                This record will be permanently erased from Google Cloud Firestore and cannot be undone.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Deletion (Optional)
            </label>
            <textarea
              rows={2}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Cancelled by employee, duplicate entry..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingLeave(null)}
              disabled={isDeletingLeave}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isDeletingLeave}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
