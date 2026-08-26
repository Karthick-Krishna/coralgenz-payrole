"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AnnouncementManager } from "@/components/shared/announcement-manager";
import { MockDataStore } from "@/lib/store/mock-store";
import { Announcement } from "@/types";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadData = () => {
    setAnnouncements(MockDataStore.getAnnouncements());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="announcements">
      <AnnouncementManager initialAnnouncements={announcements} />
    </AppLayout>
  );
}
