"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { PayslipViewer } from "@/components/payslips/payslip-viewer";
import { PayrollService } from "@/lib/firebase/payroll-service";
import { SettingsService } from "@/lib/firebase/settings-service";
import { DEMO_ORGANIZATION } from "@/lib/demo/demo-data";
import { Payslip, Organization } from "@/types";
import { Button } from "@/components/ui/button";

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(DEMO_ORGANIZATION);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayslip = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [ps, org] = await Promise.all([
        PayrollService.getPayslipById(id),
        SettingsService.getSettings(),
      ]);
      setPayslip(ps || null);
      setOrganization(org || DEMO_ORGANIZATION);
    } catch (err) {
      console.error("Error fetching payslip:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslip();
    const handleUpdate = () => fetchPayslip();
    window.addEventListener("coralgenz_store_updated", handleUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleUpdate);
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout module="payslips">
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!payslip || !organization) {
    return (
      <AppLayout module="payslips">
        <div className="py-12 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Payslip Document Not Found</h3>
          <p className="text-xs text-slate-500">
            No payslip record matching document ID &ldquo;{id}&rdquo; was found on the server.
          </p>
          <Button variant="coral" size="sm" onClick={() => router.push("/payslips")}>
            Return to Payslips Registry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout module="payslips">
      <PayslipViewer payslip={payslip} organization={organization} onRefresh={fetchPayslip} />
    </AppLayout>
  );
}
