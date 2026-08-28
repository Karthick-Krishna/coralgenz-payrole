"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AnnouncementManager } from "@/components/shared/announcement-manager";
import { AnnouncementService } from "@/lib/firebase/announcement-service";
import { Announcement } from "@/types";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await AnnouncementService.getAnnouncements();
      setAnnouncements(list);
    } catch (e) {
      console.error("Error loading announcements:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="announcements">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <AnnouncementManager initialAnnouncements={announcements} onRefresh={loadData} />
      )}
    </AppLayout>
  );
}
