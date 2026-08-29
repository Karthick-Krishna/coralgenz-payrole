"use client";

import React, { useState, useEffect } from "react";
import { Holiday } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Calendar as CalendarIcon,
  Plus,
  Building,
  Sparkles,
  Trash2,
} from "lucide-react";

interface CalendarViewProps {
  initialHolidays: Holiday[];
  onRefresh?: () => void;
}

export function CalendarView({ initialHolidays, onRefresh }: CalendarViewProps) {
  const { currentRole } = useAuth();
  const { success, error } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<Holiday["type"]>("public");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setHolidays(initialHolidays);
  }, [initialHolidays]);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/holidays", { cache: "no-store" });
      const data = await res.json();
      if (data?.holidays) {
        setHolidays(data.holidays);
      }
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      error("Missing Information", "Please enter holiday name and date.");
      return;
    }

    const d = new Date(date);
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" });

    const payload = {
      organizationId: "org-coralgenz-01",
      name,
      date,
      dayOfWeek,
      type,
      isRecurringYearly: true,
      description,
    };

    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.holiday) {
        success("Holiday Added", `Added ${name} to company calendar on server.`);
        setShowModal(false);
        setName("");
        setDescription("");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        refreshData();
        onRefresh?.();
      } else {
        error("Error", data.error || "Failed to save holiday on server.");
      }
    } catch (err: any) {
      error("Network Error", err.message || "Failed to save holiday.");
    }
  };

  const handleDelete = async (id: string, holName: string) => {
    if (!confirm(`Delete "${holName}" from company calendar?`)) return;
    try {
      const res = await fetch(`/api/holidays?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("Holiday Removed", `Removed ${holName} from server calendar.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
        }
        refreshData();
        onRefresh?.();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Company Calendar & Holidays (2026)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official public holidays, company hackathons, foundation days, and shift schedules.
          </p>
        </div>

        {currentRole !== "employee" && (
          <Button
            variant="coral"
            size="sm"
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Holiday
          </Button>
        )}
      </div>

      {/* Grid of Holidays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {holidays.map((hol) => (
          <Card key={hol.id} hoverEffect className="flex flex-col justify-between">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={hol.type === "company" ? "coral" : "success"}
                  size="sm"
                >
                  {hol.type.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {hol.dayOfWeek}
                  </span>
                  {currentRole !== "employee" && (
                    <button
                      type="button"
                      onClick={() => handleDelete(hol.id, hol.name)}
                      className="text-slate-300 hover:text-red-500 p-0.5 ml-1 transition-colors"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {hol.name}
                </h4>
                <p className="text-xs font-mono font-semibold text-coral-600 dark:text-coral-400">
                  {formatDate(hol.date, "dd MMMM yyyy")}
                </p>
              </div>

              {hol.description && (
                <p className="text-xs text-slate-500 line-clamp-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {hol.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL: ADD HOLIDAY */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Company Holiday"
        description="Schedule a gazetted holiday or company event on server"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Holiday / Event Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Diwali, Company Hackathon"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Holiday Category"
              value={type}
              onChange={(e) => setType(e.target.value as Holiday["type"])}
            >
              <option value="public">Public Gazetted Holiday</option>
              <option value="company">Company Special Event</option>
              <option value="optional">Optional / Restricted</option>
            </Select>
          </div>

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
