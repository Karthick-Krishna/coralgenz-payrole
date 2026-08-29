"use client";

import React, { useState, useEffect } from "react";
import { AttendanceService } from "@/lib/firebase/attendance-service";
import { useAuth } from "@/lib/auth/auth-context";
import { AttendanceRecord, Employee, Department } from "@/types";
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
import { useToast } from "@/components/ui/toast";
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  Fingerprint,
  Edit2,
  Edit3,
  Sparkles,
  MapPin,
  Building,
} from "lucide-react";

interface AttendanceTrackerProps {
  initialAttendance: AttendanceRecord[];
  employees: Employee[];
  departments: Department[];
  onRefresh?: () => void;
}

export function AttendanceTracker({
  initialAttendance,
  employees,
  departments,
  onRefresh,
}: AttendanceTrackerProps) {
  const { currentRole, user } = useAuth();
  const { success, error } = useToast();
  const canEditAttendance = currentRole === "super_admin" || currentRole === "hr_admin";
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Manual Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceRecord["status"]>("present");
  const [overrideReason, setOverrideReason] = useState("Biometric device sync correction");

  useEffect(() => {
    setAttendance(initialAttendance);
  }, [initialAttendance]);

  const refreshData = async () => {
    try {
      const list = await AttendanceService.getAttendance();
      setAttendance(list);
    } catch {}
  };

  useEffect(() => {
    const handleStoreUpdate = () => refreshData();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  const myEmpId =
    user?.employeeId ||
    employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase())?.id ||
    "CGG-EMP-0001";
  const isEmployee = currentRole === "employee";

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    await AttendanceService.logAttendance({
      ...editingRecord,
      checkIn: editCheckIn,
      checkOut: editCheckOut,
      status: editStatus,
      manualOverrideReason: overrideReason,
      manualOverrideBy: user?.displayName || "HR Administrator",
    });

    success("Attendance Corrected", `Updated attendance record for ${editingRecord.employeeName}`);
    setEditingRecord(null);
    refreshData();
  };

  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  const checkTodayStatus = () => {
    const today = new Date().toISOString().split("T")[0];
    const rec = attendance.find((a) => a.date === today && a.employeeId === myEmpId);
    setTodayRecord(rec || null);
    setIsPunchedIn(Boolean(rec?.checkIn && !rec?.checkOut));
  };

  useEffect(() => {
    checkTodayStatus();
  }, [attendance, myEmpId]);

  const handleQuickPunch = async () => {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];
    const currentEmp = employees.find((e) => e.id === myEmpId) || employees.find((e) => e.email?.toLowerCase() === user?.email?.toLowerCase());
    const empName = currentEmp ? `${currentEmp.firstName} ${currentEmp.lastName}`.trim() : user?.displayName || "Employee";

    if (isPunchedIn && todayRecord) {
      await AttendanceService.logAttendance({
        ...todayRecord,
        checkOut: nowTime,
        status: "present",
        updatedAt: new Date().toISOString(),
      });
      success("Clocked Out", `Clocked out successfully at ${nowTime}`);
    } else {
      await AttendanceService.logAttendance({
        id: `att-${myEmpId}-${today}`,
        organizationId: "org-coralgenz-01",
        employeeId: myEmpId,
        employeeName: empName,
        departmentId: currentEmp?.departmentId || "dept-01",
        date: today,
        checkIn: nowTime,
        status: "present",
        workMode: "office",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      success("Clocked In", `Clocked in successfully at ${nowTime}`);
    }
    await refreshData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
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
    holiday: { variant: "secondary", label: "Holiday" },
    week_off: { variant: "secondary", label: "Week Off" },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time biometric punch logs, shift hours, and overtime
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            variant={isPunchedIn ? "danger" : "primary"}
            size="sm"
            onClick={handleQuickPunch}
            leftIcon={<Fingerprint className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs shadow-sm font-bold"
          >
            {isPunchedIn ? "Punch Out (Clock Out)" : "Punch In (Clock In)"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Export Attendance CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Records</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {filteredAttendance.length}
              </h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase">Present</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{presentCount}</h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase">On Leave</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{leaveCount}</h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase">Absent</p>
              <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">{absentCount}</h3>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <Input
              type="date"
              label="Selected Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs"
            />

            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs"
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
              className="text-xs"
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

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredAttendance.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-slate-400">
              No attendance records for the selected date and filters.
            </CardContent>
          </Card>
        ) : (
          filteredAttendance.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                    {rec.employeeName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{rec.employeeId}</span>
                </div>
                <Badge
                  variant={statusVariants[rec.status]?.variant || "secondary"}
                  size="sm"
                  dot
                >
                  {statusVariants[rec.status]?.label || rec.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">In</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {rec.checkIn ? formatTime(`2026-08-26T${rec.checkIn}`) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Out</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {rec.checkOut ? formatTime(`2026-08-26T${rec.checkOut}`) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Hours</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {rec.workHoursMinutes > 0
                      ? `${Math.floor(rec.workHoursMinutes / 60)}h ${rec.workHoursMinutes % 60}m`
                      : "—"}
                  </span>
                </div>
              </div>

              {canEditAttendance && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(rec)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Adjust Record
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Attendance Table (>= md) */}
      <div className="hidden md:block">
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
                    <span className="text-xs capitalize text-slate-500">{rec.workMode}</span>
                  </TableCell>

                  {canEditAttendance && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(rec)}
                        title="Adjust Attendance"
                        className="h-8 px-2"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500 hover:text-slate-900" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manual Override Modal */}
      <Modal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title="Adjust Attendance Record"
        description={`Manually correct punch logs for ${editingRecord?.employeeName} (${editingRecord?.date})`}
        maxWidth="md"
      >
        {editingRecord && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check In Time"
                type="time"
                step="1"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                required
              />
              <Input
                label="Check Out Time"
                type="time"
                step="1"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
              />
            </div>

            <Select
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as AttendanceRecord["status"])}
            >
              <option value="present">Present</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
              <option value="absent">Absent</option>
            </Select>

            <Input
              label="Reason for Adjustment"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Card reader missed swipe, manager approval..."
              required
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingRecord(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="coral" size="sm">
                Save Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
