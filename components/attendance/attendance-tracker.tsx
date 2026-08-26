"use client";

import React, { useState, useEffect } from "react";
import { AttendanceRecord, Employee, Department } from "@/types";
import { MockDataStore } from "@/lib/store/mock-store";
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
} from "@/components/ui/table";
import { formatTime, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export/export-utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Edit2,
  Plus,
} from "lucide-react";

interface AttendanceTrackerProps {
  initialAttendance: AttendanceRecord[];
  employees: Employee[];
  departments: Department[];
}

export function AttendanceTracker({
  initialAttendance,
  employees,
  departments,
}: AttendanceTrackerProps) {
  const { currentRole, user } = useAuth();
  const { success, error } = useToast();
  const canEditAttendance = currentRole === "super_admin" || currentRole === "hr_admin";
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [selectedDate, setSelectedDate] = useState("2026-08-26");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Manual Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceRecord["status"]>("present");
  const [overrideReason, setOverrideReason] = useState("Biometric device sync correction");

  const refreshData = () => {
    const list = MockDataStore.getAttendance();
    setAttendance(list);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("coralgenz_store_updated", refreshData);
    return () => window.removeEventListener("coralgenz_store_updated", refreshData);
  }, []);

  const myEmpId =
    user?.employeeId ||
    employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase())?.id ||
    "CGG-EMP-0002";
  const isEmployee = currentRole === "employee";
  const currentEmployee = employees.find((e) => e.id === myEmpId) || employees[0];

  const filteredAttendance = attendance.filter((a) => {
    if (isEmployee) {
      if (a.employeeId !== myEmpId && a.employeeName !== user?.displayName) return false;
    }
    const matchesDate = !selectedDate || a.date === selectedDate;
    const matchesDept = selectedDept === "all" || a.departmentId === selectedDept;
    const matchesStatus = selectedStatus === "all" || a.status === selectedStatus;
    return matchesDate && matchesDept && matchesStatus;
  });

  const presentCount = filteredAttendance.filter((a) => a.status === "present").length;
  const leaveCount = filteredAttendance.filter((a) => a.status === "leave").length;
  const absentCount = filteredAttendance.filter((a) => a.status === "absent").length;

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditCheckIn(rec.checkIn || "09:00:00");
    setEditCheckOut(rec.checkOut || "18:00:00");
    setEditStatus(rec.status);
    setOverrideReason("Biometric punch correction requested");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    MockDataStore.manualUpdateAttendance(
      editingRecord.id,
      {
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        status: editStatus,
      },
      "HR Administrator",
      overrideReason
    );

    success("Attendance Corrected", `Updated attendance record for ${editingRecord.employeeName}`);
    setEditingRecord(null);
    refreshData();
  };

  const handleExportCSV = () => {
    const exportData = filteredAttendance.map((a) => ({
      Date: a.date,
      "Employee ID": a.employeeId,
      "Employee Name": a.employeeName,
      "Punch In": a.checkIn || "—",
      "Punch Out": a.checkOut || "—",
      "Work Minutes": a.workHoursMinutes,
      "Overtime Minutes": a.overtimeMinutes,
      Status: a.status.toUpperCase(),
      "Work Mode": a.workMode,
      "Override Reason": a.manualOverrideReason || "—",
    }));
    exportToCSV(exportData, `Coralgenz_Attendance_${selectedDate}`);
  };

  const statusVariants: Record<AttendanceRecord["status"], { variant: "success" | "warning" | "danger" | "info" | "secondary"; label: string }> = {
    present: { variant: "success", label: "Present" },
    absent: { variant: "danger", label: "Absent" },
    half_day: { variant: "warning", label: "Half Day" },
    leave: { variant: "info", label: "On Leave" },
    holiday: { variant: "purple" as "secondary", label: "Holiday" },
    week_off: { variant: "secondary", label: "Week Off" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric attendance punch logs, shift hours, overtime, and manual HR adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Attendance CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card hoverEffect>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Records</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {filteredAttendance.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase">Present Today</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{presentCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-600 uppercase">On Leave</p>
              <h3 className="text-2xl font-black text-blue-600 mt-0.5">{leaveCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 uppercase">Absent / Unreported</p>
              <h3 className="text-2xl font-black text-rose-600 mt-0.5">{absentCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="date"
              label="Selected Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Attendance Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="half_day">Half Day</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Punch In</TableHead>
            <TableHead>Punch Out</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Work Mode</TableHead>
            {canEditAttendance && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAttendance.length === 0 ? (
            <tr>
              <td colSpan={canEditAttendance ? 8 : 7} className="p-8 text-center text-xs text-slate-400">
                No attendance records for the selected date and filters.
              </td>
            </tr>
          ) : (
            filteredAttendance.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {rec.employeeName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{rec.employeeId}</span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {rec.checkIn ? formatTime(`2026-08-26T${rec.checkIn}`) : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {rec.checkOut ? formatTime(`2026-08-26T${rec.checkOut}`) : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium">
                    {rec.workHoursMinutes > 0
                      ? `${Math.floor(rec.workHoursMinutes / 60)}h ${rec.workHoursMinutes % 60}m`
                      : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium text-amber-600">
                    {rec.overtimeMinutes > 0
                      ? `+${Math.floor(rec.overtimeMinutes / 60)}h ${rec.overtimeMinutes % 60}m`
                      : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={statusVariants[rec.status]?.variant || "secondary"}
                    size="sm"
                    dot
                  >
                    {statusVariants[rec.status]?.label || rec.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="capitalize text-xs text-slate-500">
                    {rec.workMode || "office"}
                  </span>
                </TableCell>

                {canEditAttendance && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(rec)}
                      title="Manual Override"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* MODAL: MANUAL EDIT ATTENDANCE */}
      <Modal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title="Manual Attendance Adjustment"
        description={`Modify daily punch log for ${editingRecord?.employeeName} (${editingRecord?.date})`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Check-In Time"
              value={editCheckIn}
              onChange={(e) => setEditCheckIn(e.target.value)}
              placeholder="09:00:00"
            />
            <Input
              label="Check-Out Time"
              value={editCheckOut}
              onChange={(e) => setEditCheckOut(e.target.value)}
              placeholder="18:00:00"
            />
          </div>

          <Select
            label="Attendance Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as AttendanceRecord["status"])}
          >
            <option value="present">Present (Full Day)</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </Select>

          <Input
            label="Override Reason (Audit Requirement)"
            required
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="e.g. Biometric device failure, Client on-site duty"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingRecord(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Save & Log Audit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
