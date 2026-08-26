"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MockDataStore } from "@/lib/store/mock-store";
import { Employee, Department, Announcement, PayrollRun } from "@/types";
import { Search, User, Building2, Megaphone, CreditCard, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEmployees(MockDataStore.getEmployees());
      setDepartments(MockDataStore.getDepartments());
      setAnnouncements(MockDataStore.getAnnouncements());
      setPayrollRuns(MockDataStore.getPayrollRuns());
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or custom event
          window.dispatchEvent(new CustomEvent("open_global_search"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredEmployees = q
    ? employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.designationTitle.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      ).slice(0, 5)
    : employees.slice(0, 3);

  const filteredDepartments = q
    ? departments.filter(
        (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
      ).slice(0, 3)
    : departments.slice(0, 2);

  const filteredAnnouncements = q
    ? announcements.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      ).slice(0, 3)
    : announcements.slice(0, 2);

  const filteredPayroll = q
    ? payrollRuns.filter((p) => p.periodName.toLowerCase().includes(q)).slice(0, 2)
    : payrollRuns.slice(0, 2);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
          {/* Search Input Box */}
          <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees, departments, payroll, announcements... (ESC to close)"
              className="w-full bg-transparent px-3 py-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {/* Employees */}
            {filteredEmployees.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Employees</span>
                </div>
                <div className="space-y-1">
                  {filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelect(`/employees/${emp.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-coral-100 dark:bg-coral-950/80 text-coral-600 font-bold text-xs flex items-center justify-center">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-coral-500 transition-colors">
                            {emp.firstName} {emp.lastName}
                            <span className="ml-2 text-[10px] font-normal text-slate-400">
                              {emp.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {emp.designationTitle} • {emp.departmentName}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Departments */}
            {filteredDepartments.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Departments</span>
                </div>
                <div className="space-y-1">
                  {filteredDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleSelect("/departments")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-coral-500">
                          {dept.name} ({dept.code})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {dept.employeeCount} team members • Head: {dept.headEmployeeName || "Unassigned"}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            {filteredAnnouncements.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Announcements</span>
                </div>
                <div className="space-y-1">
                  {filteredAnnouncements.map((ann) => (
                    <button
                      key={ann.id}
                      onClick={() => handleSelect("/announcements")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-coral-500">
                          {ann.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {ann.content}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payroll Runs */}
            {filteredPayroll.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payroll Records</span>
                </div>
                <div className="space-y-1">
                  {filteredPayroll.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => handleSelect("/payroll")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-coral-500">
                          Payroll Cycle: {run.periodName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Status: {run.status.toUpperCase()} • Net: ₹{run.totalNetPayroll.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredEmployees.length === 0 &&
              filteredDepartments.length === 0 &&
              filteredAnnouncements.length === 0 &&
              filteredPayroll.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No matching results found for &ldquo;{query}&rdquo;
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
