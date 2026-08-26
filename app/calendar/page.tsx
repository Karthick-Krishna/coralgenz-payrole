"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { CalendarView } from "@/components/shared/calendar-view";
import { MockDataStore } from "@/lib/store/mock-store";
import { Holiday } from "@/types";

export default function CalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const loadData = () => {
    setHolidays(MockDataStore.getHolidays());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="calendar">
      <CalendarView initialHolidays={holidays} />
    </AppLayout>
  );
}
