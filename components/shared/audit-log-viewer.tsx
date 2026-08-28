"use client";

import React, { useState, useEffect } from "react";
import { AuditLog } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { exportToCSV } from "@/lib/export/export-utils";
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  User,
  Clock,
} from "lucide-react";

interface AuditLogViewerProps {
  initialLogs: AuditLog[];
}

export function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      l.userName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q);

    const matchesModule = moduleFilter === "all" || l.module === moduleFilter;
    return matchesQ && matchesModule;
  });

  const handleExportCSV = () => {
    const data = filteredLogs.map((l) => ({
      Timestamp: l.timestamp,
      User: l.userName,
      Role: l.userRole,
      Action: l.action,
      Module: l.module,
      Details: l.details,
      "IP Address": l.ipAddress || "—",
    }));
    exportToCSV(data, "Coralgenz_Security_Audit_Logs");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable system logs tracking logins, payroll locks, salary revisions, attendance overrides, and administrative modifications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Audit CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Search by user, action, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              <option value="auth">Authentication</option>
              <option value="payroll">Payroll Runs</option>
              <option value="employee">Employee Profiles</option>
              <option value="leave">Leave Workflows</option>
              <option value="attendance">Attendance Adjustments</option>
              <option value="settings">System Settings</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User / Operator</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <TableEmptyState
                  icon={<ShieldAlert className="w-8 h-8" />}
                  title="No audit logs matched"
                  description="No audit trail events match the current filter parameters."
                />
              </td>
            </tr>
          ) : (
            filteredLogs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(l.timestamp, "dd MMM yyyy, hh:mm:ss a")}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    {l.userName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{l.ipAddress || "Internal Server"}</span>
                </TableCell>

                <TableCell>
                  <Badge variant="coral" size="sm" className="uppercase text-[9px]">
                    {l.userRole.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-300">
                    {l.module}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary" size="sm">
                    {l.action.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block max-w-md">
                    {l.details}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
