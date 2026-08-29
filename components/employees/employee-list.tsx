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
import { exportToCSV, exportToExcel } from "@/lib/export/export-utils";
import { EmployeeService } from "@/lib/firebase/employee-service";
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Phone,
  Mail,
  ChevronRight,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredEmployees.length} total staff members in Tamil Nadu
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="flex-1 sm:flex-none text-xs"
          >
            Export CSV
          </Button>
          <Button
            variant="coral"
            size="sm"
            onClick={() => router.push("/employees/new")}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-none text-xs"
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Search Input */}
            <Input
              placeholder="Search name, ID, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
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
              <option value="date">Sort by Joining Date</option>
              <option value="salary">Sort by Salary (High-Low)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card Grid View (Shown on mobile screens < md) */}
      <div className="block md:hidden space-y-3">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-sky-100 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(`${emp.firstName} ${emp.lastName}`)
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-coral-500 transition-colors truncate block"
                    >
                      {emp.firstName} {emp.lastName}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {emp.designationTitle}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={statusBadges[emp.status]?.variant || "secondary"}
                  size="sm"
                  dot
                >
                  {statusBadges[emp.status]?.label || emp.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Department</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                    {emp.departmentName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Monthly Gross</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatINR(emp.currentMonthlyGross)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">
                  {emp.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingEmployee(emp)}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                    title="Remove Employee from Server"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/employees/${emp.id}?edit=true`)}
                    className="h-8 px-2.5 text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    className="h-8 px-2.5 text-xs"
                  >
                    View
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Employees Table (Shown on screens >= md) */}
      <div className="hidden md:block">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingEmployee(emp)}
                        title="Delete Employee from Server"
                        className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
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
                <p className="font-semibold text-sm mb-1">Permanent Data & Record Cascading Removal</p>
                <p>
                  You are about to permanently remove <strong>{deletingEmployee.firstName} {deletingEmployee.lastName}</strong> ({deletingEmployee.id}).
                  Their profile, login credentials, attendance records, leave applications, generated payslips, and payroll records will be automatically erased from Google Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Employee ID:</span> <span className="font-mono font-bold">{deletingEmployee.id}</span></p>
              <p><span className="text-slate-400">Official Email:</span> <span className="font-medium">{deletingEmployee.email}</span></p>
              <p><span className="text-slate-400">Designation:</span> <span className="font-medium">{deletingEmployee.designationTitle}</span></p>
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
