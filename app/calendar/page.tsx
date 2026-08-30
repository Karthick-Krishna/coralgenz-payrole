"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { CalendarView } from "@/components/shared/calendar-view";
import { Holiday } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function CalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const res = await fetch("/api/holidays", { cache: "no-store" });
      const data = await res.json();
      if (data?.holidays) {
        setHolidays(data.holidays);
      }
    } catch (e) {
      console.error("Error loading holidays:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleUpdate);
  }, []);

  return (
    <AppLayout module="calendar">
      {isLoading ? (
        <PageLogoLoader text="Loading Corporate Holiday Calendar & Event Schedule..." />
      ) : (
        <CalendarView initialHolidays={holidays} onRefresh={() => loadData(false)} />
      )}
    </AppLayout>
  );
}
