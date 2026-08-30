"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsView } from "@/components/settings/settings-view";
import { DEMO_ORGANIZATION } from "@/lib/demo/demo-data";
import { Organization } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization>(DEMO_ORGANIZATION);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data?.organization) {
        setOrganization(data.organization);
      }
    } catch (e) {
      console.error("Error loading settings:", e);
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
    <AppLayout module="settings">
      {isLoading ? (
        <PageLogoLoader text="Loading Enterprise System Configuration & Security Rules..." />
      ) : (
        <SettingsView initialOrg={organization} onRefresh={() => loadData(false)} />
      )}
    </AppLayout>
  );
}
