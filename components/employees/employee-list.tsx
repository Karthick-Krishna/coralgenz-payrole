"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Employee, Department, Designation, EmployeeStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "@/components/ui/table";
import { formatINR, formatDate, getInitials } from "@/lib/utils";
import { exportToCSV, exportToExcel } from "@/lib/export/export-utils";
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  UserX,
  Building2,
  Users,
} from "lucide-react";

interface EmployeeListProps {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  onDeleteEmployee?: (id: string) => void;
}

export function EmployeeList({
  employees,
  departments,
  designations,
  onDeleteEmployee,
}: EmployeeListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "salary">("name");

  // Filtering & Sorting
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
          emp.id.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.designationTitle.toLowerCase().includes(query);

        const matchesDept =
          selectedDept === "all" || emp.departmentId === selectedDept;
        const matchesStatus =
          selectedStatus === "all" || emp.status === selectedStatus;

        return matchesQuery && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (sortBy === "date") {
          return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
        } else if (sortBy === "salary") {
          return b.currentMonthlyGross - a.currentMonthlyGross;
        }
        return 0;
      });
  }, [employees, searchQuery, selectedDept, selectedStatus, sortBy]);

  const handleExportCSV = () => {
    const exportData = filteredEmployees.map((e) => ({
      "Employee ID": e.id,
      "Full Name": `${e.firstName} ${e.lastName}`,
      Email: e.email,
      Phone: e.phone,
      Department: e.departmentName,
      Designation: e.designationTitle,
      "Employment Type": e.employmentType,
      Status: e.status,
      "Joining Date": e.joiningDate,
      "Monthly Gross (INR)": e.currentMonthlyGross,
      "Annual CTC (INR)": e.currentAnnualCtc,
      "Bank Name": e.bankDetails?.bankName,
      "IFSC Code": e.bankDetails?.ifscCode,
    }));
    exportToCSV(exportData, "Coralgenz_Employees_Roster");
  };

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((e) => ({
      "Employee ID": e.id,
      "Full Name": `${e.firstName} ${e.lastName}`,
      Email: e.email,
      Phone: e.phone,
      Department: e.departmentName,
      Designation: e.designationTitle,
      "Employment Type": e.employmentType,
      Status: e.status,
      "Joining Date": e.joiningDate,
      "Monthly Gross (INR)": e.currentMonthlyGross,
      "Annual CTC (INR)": e.currentAnnualCtc,
    }));
    exportToExcel(exportData, "Coralgenz_Employees_Roster", "Employees");
  };

  const statusBadges: Record<EmployeeStatus, { variant: "success" | "warning" | "danger" | "secondary"; label: string }> = {
    active: { variant: "success", label: "Active" },
    probation: { variant: "warning", label: "Probation" },
    on_leave: { variant: "secondary", label: "On Leave" },
    resigned: { variant: "danger", label: "Resigned" },
    terminated: { variant: "danger", label: "Terminated" },
    retired: { variant: "secondary", label: "Retired" },
    inactive: { variant: "secondary", label: "Inactive" },
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage organization employees, roles, departments, salary profiles, and employment documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/employees/new")}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <Input
              placeholder="Search by name, ID, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            {/* Department Filter */}
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="on_leave">On Leave</option>
              <option value="resigned">Resigned</option>
              <option value="inactive">Inactive</option>
            </Select>

            {/* Sort Options */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date" | "salary")}
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="date">Sort by Joining Date</option>
              <option value="salary">Sort by Salary (High-Low)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Monthly Gross</TableHead>
            <TableHead>Joining Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <TableEmptyState
                  icon={<Users className="w-8 h-8" />}
                  title="No employees found"
                  description="No employee records match your current filter criteria."
                  action={
                    <Button
                      variant="coral"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDept("all");
                        setSelectedStatus("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                  }
                />
              </td>
            </tr>
          ) : (
            filteredEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-100 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(`${emp.firstName} ${emp.lastName}`)
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-coral-500 transition-colors"
                      >
                        {emp.firstName} {emp.lastName}
                      </Link>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {emp.id}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {emp.departmentName}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {emp.designationTitle}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={statusBadges[emp.status]?.variant || "secondary"}
                    size="sm"
                    dot
                  >
                    {statusBadges[emp.status]?.label || emp.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {formatINR(emp.currentMonthlyGross)}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-500">
                    {formatDate(emp.joiningDate)}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                      title="View Profile"
                      className="h-8 px-2"
                    >
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-900" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/employees/${emp.id}?edit=true`)}
                      title="Edit Employee"
                      className="h-8 px-2"
                    >
                      <Edit className="w-4 h-4 text-slate-500 hover:text-slate-900" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
