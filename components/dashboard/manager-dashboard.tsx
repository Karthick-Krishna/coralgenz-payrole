"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MockDataStore } from "@/lib/store/mock-store";
import { LeaveService } from "@/lib/firebase/leave-service";
import {
  Users,
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Employee, LeaveRequest, AttendanceRecord } from "@/types";

interface ManagerDashboardProps {
  managerEmployee?: Employee;
  teamEmployees: Employee[];
  teamLeaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
}

export function ManagerDashboard({
  managerEmployee,
  teamEmployees,
  teamLeaveRequests,
  attendance,
}: ManagerDashboardProps) {
  const router = useRouter();

  const pendingTeamLeaves = teamLeaveRequests.filter((l) => l.status === "pending");
  const presentCount = attendance.filter((a) =>
    teamEmployees.some((te) => te.id === a.employeeId && a.status === "present")
  ).length;

  const handleApprove = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(reqId, "approved", "Approved by Team Manager");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
  };

  const handleReject = async (reqId: string) => {
    await LeaveService.updateLeaveStatus(reqId, "rejected", "Rejected by Team Manager");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-700 via-orange-700 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="warning" size="sm" className="bg-white/20 text-white border-none">
            Team Manager Console
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Team Overview & Approvals
          </h1>
          <p className="text-xs text-white/80">
            Monitor direct reports, check daily team attendance punches, and approve leaves.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/leave")}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            className="w-full sm:w-auto bg-white text-amber-800 hover:bg-white/90 border-none shadow-sm text-xs"
          >
            Review Team Leaves
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6">
        <Card hoverEffect>
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{teamEmployees.length}</h3>
              <p className="text-[10px] text-slate-400">Direct Team</p>
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
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{presentCount}/{teamEmployees.length}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold">{Math.round((presentCount / (teamEmployees.length || 1)) * 100)}% active</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect className="col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{pendingTeamLeaves.length}</h3>
              <p className="text-[10px] text-amber-600 font-semibold">Sign-off required</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Leave Approvals & Team Member Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pending Approvals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Team Leave Requests</CardTitle>
            <Badge variant="warning" size="sm">
              {pendingTeamLeaves.length} Pending
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingTeamLeaves.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                🎉 No pending team leave requests!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTeamLeaves.map((req) => (
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
                          ({req.daysCount} days)
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
                        onClick={() => handleApprove(req.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(req.id)}
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

        {/* Direct Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Direct reports</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {teamEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{emp.designationTitle}</p>
                </div>
                <Badge variant={emp.status === "active" ? "success" : "warning"} size="sm" className="shrink-0">
                  {emp.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
