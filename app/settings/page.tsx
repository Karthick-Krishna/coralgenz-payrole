"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsView } from "@/components/settings/settings-view";
import { MockDataStore } from "@/lib/store/mock-store";
import { Organization } from "@/types";

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization>(MockDataStore.getOrganization());

  const loadData = () => {
    setOrganization(MockDataStore.getOrganization());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="settings">
      <SettingsView initialOrg={organization} />
    </AppLayout>
  );
}
