"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AuditLogViewer } from "@/components/shared/audit-log-viewer";
import { AuditService } from "@/lib/firebase/audit-service";
import { AuditLog } from "@/types";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const list = await AuditService.getLogs();
      setLogs(list as any[]);
    } catch (e) {
      console.error("Error loading audit logs:", e);
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
    <AppLayout module="audit_logs">
      {isLoading ? (
        <PageLogoLoader text="Retrieving Immutable Security Audit Logs from Database..." />
      ) : (
        <AuditLogViewer initialLogs={logs} />
      )}
    </AppLayout>
  );
}
