"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { LeaveService } from "@/lib/firebase/leave-service";
import {
  Users,
  UserPlus,
  Clock,
  CalendarCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  Employee,
  LeaveRequest,
  AttendanceRecord,
  Department,
  Holiday,
} from "@/types";

interface HRDashboardProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  departments: Department[];
  holidays: Holiday[];
}

export function HRDashboard({
  employees,
  leaveRequests,
  attendance,
  departments,
  holidays,
}: HRDashboardProps) {
  const router = useRouter();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const probationEmployees = employees.filter((e) => e.status === "probation").length;
  const presentToday = attendance.filter((a) => a.status === "present").length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");

  const handleApproveLeave = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(reqId, "approved", "Approved by HR");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
  };

  const handleRejectLeave = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(reqId, "rejected", "Rejected by HR");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-800 via-sky-700 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="success" size="sm" className="bg-white/20 text-white border-none">
            HR Operations Control Center
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Human Resources & Workforce
          </h1>
          <p className="text-xs text-white/80">
            Employee directories, leave requests, attendance logs, and staff assignments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/employees/new")}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-white/90 border-none shadow-sm text-xs"
          >
            Add New Employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/attendance")}
            leftIcon={<Clock className="w-4 h-4" />}
            className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10 text-xs"
          >
            Attendance Logs
          </Button>
        </div>
      </div>

      {/* KPI Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Headcount</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{totalEmployees}</h3>
              <p className="text-[10px] text-slate-400 truncate">{activeEmployees} Confirmed</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Present</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{presentToday}/{activeEmployees}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold">{Math.round((presentToday / (activeEmployees || 1)) * 100)}% active</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{pendingLeaves.length}</h3>
              <p className="text-[10px] text-amber-600 font-semibold">Review needed</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Depts</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{departments.length}</h3>
              <p className="text-[10px] text-slate-400">All staffed</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split: Pending Leave Approvals & Department Headcounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pending Leave Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Leave Approvals Queue</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Action pending applications
              </p>
            </div>
            <Badge variant="warning" size="sm">
              {pendingLeaves.length} Pending
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                🎉 No pending leave requests. Everything is up to date!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {req.employeeName}
                        </span>
                        <Badge variant="coral" size="sm" className="capitalize">
                          {req.leaveType}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          ({req.daysCount} {req.daysCount === 1 ? "day" : "days"})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {req.reason}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(req.startDate)} to {formatDate(req.endDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveLeave(req.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectLeave(req.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Department Headcount</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Team distribution</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {dept.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Head: {dept.headEmployeeName || "Unassigned"}
                  </p>
                </div>
                <Badge variant="secondary" size="sm" className="shrink-0">
                  {dept.employeeCount} Members
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
