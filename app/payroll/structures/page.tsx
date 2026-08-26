"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { SalaryStructureView } from "@/components/payroll/salary-structure-view";
import { DEMO_SALARY_STRUCTURE } from "@/lib/demo/demo-data";
import { SalaryStructure } from "@/types";

export default function SalaryStructuresPage() {
  const [structure, setStructure] = useState<SalaryStructure>(DEMO_SALARY_STRUCTURE);

  return (
    <AppLayout module="payroll">
      <SalaryStructureView initialStructure={structure} />
    </AppLayout>
  );
}
