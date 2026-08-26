"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MockDataStore } from "@/lib/store/mock-store";
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

  const handleApprove = (reqId: string) => {
    MockDataStore.updateLeaveStatus(
      reqId,
      "approved",
      managerEmployee?.id || "usr-manager-01",
      managerEmployee ? `${managerEmployee.firstName} ${managerEmployee.lastName}` : "Manager",
      "Approved by Team Manager"
    );
  };

  const handleReject = (reqId: string) => {
    MockDataStore.updateLeaveStatus(
      reqId,
      "rejected",
      managerEmployee?.id || "usr-manager-01",
      managerEmployee ? `${managerEmployee.firstName} ${managerEmployee.lastName}` : "Manager",
      "Rejected by Team Manager"
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-700 via-orange-700 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="warning" size="sm" className="bg-white/20 text-white border-none">
            Team Manager Console
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Team Overview & Approvals
          </h1>
          <p className="text-xs text-white/80">
            Monitor direct reports, check daily team attendance punches, and approve leave applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/leave")}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            className="bg-white text-amber-800 hover:bg-white/90 border-none shadow-sm"
          >
            Review Team Leaves
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Reports</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{teamEmployees.length}</h3>
              <p className="text-[11px] text-slate-400">Software & Product Design</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Present Today</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{presentCount} / {teamEmployees.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">{Math.round((presentCount / (teamEmployees.length || 1)) * 100)}% attendance</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leave Approvals</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{pendingTeamLeaves.length}</h3>
              <p className="text-[11px] text-amber-600 font-semibold">Requires Your Sign-off</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Leave Approvals & Team Member Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Leave Requests</CardTitle>
            <Badge variant="warning" size="sm">
              {pendingTeamLeaves.length} Pending
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingTeamLeaves.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                🎉 No pending team leave requests!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTeamLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
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
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {req.reason}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(req.startDate)} to {formatDate(req.endDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(req.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
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
            <CardTitle>Team Members</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your direct reports</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400">{emp.designationTitle}</p>
                </div>
                <Badge variant={emp.status === "active" ? "success" : "warning"} size="sm">
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
