"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { AuditLogViewer } from "@/components/shared/audit-log-viewer";
import { AuditService } from "@/lib/firebase/audit-service";
import { AuditLog } from "@/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await AuditService.getLogs();
      setLogs(list as any[]);
    } catch (e) {
      console.error("Error loading audit logs:", e);
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
    <AppLayout module="audit_logs">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      ) : (
        <AuditLogViewer initialLogs={logs} />
      )}
    </AppLayout>
  );
}
