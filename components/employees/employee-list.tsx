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
import { formatINR, formatDate, getInitials } from "@/lib/utils";
import { exportToCSV } from "@/lib/export/export-utils";
import { EmployeeService } from "@/lib/firebase/employee-service";
import {
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface EmployeeListProps {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  onDeleteEmployee?: (id: string) => Promise<void> | void;
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

  // Deletion Modal State
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      if (onDeleteEmployee) {
        await onDeleteEmployee(deletingEmployee.id);
      } else {
        await EmployeeService.deleteEmployee(deletingEmployee.id);
      }
      setDeletingEmployee(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper map for department and designation fallbacks
  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const desigMap = useMemo(() => {
    const map = new Map<string, string>();
    designations.forEach((d) => map.set(d.id, d.title));
    return map;
  }, [designations]);

  // Filtering & Sorting
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
        const empId = (emp.id || "").toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const desig = (emp.designationTitle || desigMap.get(emp.designationId || "") || "").toLowerCase();
        const deptName = (emp.departmentName || deptMap.get(emp.departmentId || "") || "").toLowerCase();

        const matchesQuery =
          !query ||
          fullName.includes(query) ||
          empId.includes(query) ||
          email.includes(query) ||
          desig.includes(query) ||
          deptName.includes(query);

        const matchesDept =
          selectedDept === "all" || emp.departmentId === selectedDept;
        const matchesStatus =
          selectedStatus === "all" || emp.status === selectedStatus;

        return matchesQuery && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
          return nameA.localeCompare(nameB);
        } else if (sortBy === "date") {
          return new Date(b.joiningDate || 0).getTime() - new Date(a.joiningDate || 0).getTime();
        } else if (sortBy === "salary") {
          return (Number(b.currentMonthlyGross) || 0) - (Number(a.currentMonthlyGross) || 0);
        }
        return 0;
      });
  }, [employees, searchQuery, selectedDept, selectedStatus, sortBy, deptMap, desigMap]);

  // Summary Metrics
  const activeCount = employees.filter((e) => e.status === "active").length;
  const totalMonthlyGross = employees.reduce((sum, e) => sum + (Number(e.currentMonthlyGross) || 0), 0);

  const handleExportCSV = () => {
    const exportData = filteredEmployees.map((e) => ({
      "Employee ID": e.id,
      "Full Name": `${e.firstName || ""} ${e.lastName || ""}`.trim(),
      Email: e.email || "",
      Phone: e.phone || "",
      Department: e.departmentName || deptMap.get(e.departmentId || "") || "General",
      Designation: e.designationTitle || desigMap.get(e.designationId || "") || "Staff",
      "Employment Type": e.employmentType || "full_time",
      Status: e.status || "active",
      "Joining Date": e.joiningDate || "",
      "Monthly Gross (INR)": e.currentMonthlyGross || 0,
      "Annual CTC (INR)": e.currentAnnualCtc || (Number(e.currentMonthlyGross) || 0) * 12,
      "Bank Name": e.bankDetails?.bankName || "",
      "IFSC Code": e.bankDetails?.ifscCode || "",
    }));
    exportToCSV(exportData, "Coralgenz_Employees_Roster");
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
            Complete corporate workforce roster, statutory records, and identity management.
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
            Onboard Employee
          </Button>
        </div>
      </div>

      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Headcount
            </span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {employees.length} <span className="text-xs font-normal text-slate-400">Staff</span>
          </p>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Active On Payroll
            </span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeCount} <span className="text-xs font-normal text-slate-400">Active</span>
          </p>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {departments.length} <span className="text-xs font-normal text-slate-400">Divisions</span>
          </p>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Monthly Commitment
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-2 truncate">
            {formatINR(totalMonthlyGross)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <Input
              placeholder="Search name, ID, designation, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="text-xs"
            />

            {/* Department Filter */}
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs"
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
              className="text-xs"
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
              className="text-xs"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="date">Sort by Joining Date (Newest)</option>
              <option value="salary">Sort by Salary (Highest First)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card Grid View (Shown on mobile screens < md) */}
      <div className="block md:hidden space-y-3">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <TableEmptyState
                icon={<Users className="w-8 h-8 text-slate-400" />}
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
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((emp) => {
            const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.id;
            const deptName = emp.departmentName || deptMap.get(emp.departmentId || "") || "General";
            const desigTitle = emp.designationTitle || desigMap.get(emp.designationId || "") || "Staff";
            const statusConfig = statusBadges[emp.status] || { variant: "secondary", label: emp.status || "Active" };

            return (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(fullName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-coral-500 transition-colors truncate block"
                      >
                        {fullName}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {desigTitle}
                      </p>
                    </div>
                  </div>

                  <Badge variant={statusConfig.variant} size="sm" dot>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Department</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {deptName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Monthly Gross</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                      {formatINR(emp.currentMonthlyGross || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {emp.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingEmployee(emp)}
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                      title="Remove Employee from Server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="coral"
                      size="sm"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                      className="h-8 px-3 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Employees Table (Shown on screens >= md) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Profile</TableHead>
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
                    icon={<Users className="w-8 h-8 text-slate-400" />}
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
              filteredEmployees.map((emp) => {
                const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.id;
                const deptName = emp.departmentName || deptMap.get(emp.departmentId || "") || "General";
                const desigTitle = emp.designationTitle || desigMap.get(emp.designationId || "") || "Staff";
                const statusConfig = statusBadges[emp.status] || { variant: "secondary", label: emp.status || "Active" };

                return (
                  <TableRow key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(fullName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-coral-500 transition-colors truncate block"
                          >
                            {fullName}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">{emp.email || "No email registered"}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {emp.id}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {deptName}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {desigTitle}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusConfig.variant} size="sm" dot>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(emp.currentMonthlyGross || 0)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(emp.joiningDate || new Date().toISOString())}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="coral"
                          size="sm"
                          onClick={() => router.push(`/employees/${emp.id}`)}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingEmployee(emp)}
                          title="Permanently remove employee from database server"
                          className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permanent Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        title="Remove Employee from Server"
        description="This action will permanently delete the employee record and authentication account from the database server."
        maxWidth="md"
      >
        {deletingEmployee && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Permanent Data & Cascading Record Removal</p>
                <p>
                  You are about to permanently remove <strong>{deletingEmployee.firstName} {deletingEmployee.lastName}</strong> ({deletingEmployee.id}).
                  Their profile, login credentials, attendance records, leave applications, generated payslips, and payroll records will be automatically erased from Google Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Employee ID:</span> <span className="font-mono font-bold">{deletingEmployee.id}</span></p>
              <p><span className="text-slate-400">Official Email:</span> <span className="font-medium">{deletingEmployee.email}</span></p>
              <p><span className="text-slate-400">Designation:</span> <span className="font-medium">{deletingEmployee.designationTitle || deptMap.get(deletingEmployee.departmentId || "") || "Staff"}</span></p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Confirm Permanent Removal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
