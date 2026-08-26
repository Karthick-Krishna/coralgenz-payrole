"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { PayslipViewer } from "@/components/payslips/payslip-viewer";
import { MockDataStore } from "@/lib/store/mock-store";
import { Payslip, Organization } from "@/types";
import { Button } from "@/components/ui/button";

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (!id) return;
    const ps = MockDataStore.getPayslipById(id);
    const org = MockDataStore.getOrganization();
    setPayslip(ps || null);
    setOrganization(org);
  }, [id]);

  if (!payslip || !organization) {
    return (
      <AppLayout module="payslips">
        <div className="py-12 text-center space-y-3">
          <h3 className="text-base font-bold">Payslip Document Not Found</h3>
          <p className="text-xs text-slate-500">
            No payslip record matching document ID &ldquo;{id}&rdquo; was found.
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
      <PayslipViewer payslip={payslip} organization={organization} />
    </AppLayout>
  );
}
