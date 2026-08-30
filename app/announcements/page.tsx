"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AnnouncementManager } from "@/components/shared/announcement-manager";
import { AnnouncementService } from "@/lib/firebase/announcement-service";
import { Announcement } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const list = await AnnouncementService.getAnnouncements();
      setAnnouncements(list);
    } catch (e) {
      console.error("Error loading announcements:", e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleStoreUpdate = () => loadData(false);
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  return (
    <AppLayout module="announcements">
      {isLoading ? (
        <PageLogoLoader text="Loading Corporate Announcements & Executive Broadcasts..." />
      ) : (
        <AnnouncementManager initialAnnouncements={announcements} onRefresh={loadData} />
      )}
    </AppLayout>
  );
}
