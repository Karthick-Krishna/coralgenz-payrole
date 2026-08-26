"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AuditLogViewer } from "@/components/shared/audit-log-viewer";
import { MockDataStore } from "@/lib/store/mock-store";
import { AuditLog } from "@/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const loadData = () => {
    setLogs(MockDataStore.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("coralgenz_store_updated", loadData);
    return () => window.removeEventListener("coralgenz_store_updated", loadData);
  }, []);

  return (
    <AppLayout module="audit_logs">
      <AuditLogViewer initialLogs={logs} />
    </AppLayout>
  );
}
