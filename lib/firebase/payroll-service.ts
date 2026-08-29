import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { AuditService } from './audit-service';
import { PayrollRun, PayrollItem, Payslip, Employee } from '@/types';
import { EmployeeService } from './employee-service';

export interface ProcessPayrollParams {
  month: number;
  year: number;
  periodName?: string;
  startDate?: string;
  endDate?: string;
  paymentDate?: string;
  processedBy?: string;
  processedByName?: string;
}

export interface LockPayrollParams {
  runId: string;
  run?: PayrollRun;
  items?: PayrollItem[];
  approvedBy?: string;
  approvedByName?: string;
}

export class PayrollService {
  public static async getPayrollRuns(): Promise<PayrollRun[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const q = query(collection(db, 'payrollRuns'));
      const snap = await getDocs(q);
      const runs: PayrollRun[] = [];
      snap.forEach((d) => runs.push({ ...d.data(), id: d.id } as PayrollRun));
      return runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
      console.error('Firestore getPayrollRuns error:', error.message);
      return [];
    }
  }

  public static async processPayrollRun(params: ProcessPayrollParams): Promise<{
    success: boolean;
    run?: PayrollRun;
    items?: PayrollItem[];
    error?: string;
  }> {
    if (!isFirebaseConfigured || !db) return { success: false, error: 'Firebase not configured' };

    try {
      const runId = `pr-${params.year}-${String(params.month).padStart(2, '0')}`;
      
      // Check if already processed
      const existingRunSnap = await getDoc(doc(db, 'payrollRuns', runId));
      if (existingRunSnap.exists() && existingRunSnap.data().status === 'processed') {
         // Return existing
         const itemsSnap = await getDocs(query(collection(db, 'payrollItems'), where('runId', '==', runId)));
         const items: PayrollItem[] = [];
         itemsSnap.forEach(d => items.push(d.data() as PayrollItem));
         return { success: true, run: { ...existingRunSnap.data(), id: existingRunSnap.id } as PayrollRun, items };
      }

      const employees = await EmployeeService.getEmployees();
      const activeEmployees = employees.filter(e => e.status !== 'inactive');

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let totalTaxes = 0;

      const payrollItems: PayrollItem[] = activeEmployees.map((emp, index) => {
        const monthlyGross = emp.currentMonthlyGross || 0;
        
        // India statutory payroll math
        const basic = Math.round(monthlyGross * 0.50);
        const hra = Math.round(monthlyGross * 0.25);
        const conveyance = 1600;
        const medical = 1250;
        const special = Math.max(0, monthlyGross - (basic + hra + conveyance + medical));
        
        // Deductions
        const pf = Math.round(Math.min(basic, 15000) * 0.12);
        const pt = monthlyGross > 15000 ? 200 : 0;
        const tds = Math.round(monthlyGross * 0.05); // Standard 5% estimate
        const deductions = pf + pt + tds;
        const net = monthlyGross - deductions;

        totalGross += monthlyGross;
        totalNet += net;
        totalDeductions += deductions;
        totalTaxes += (pt + tds);

        const defaultPayslipNumber = `CGG-PS-${params.year}-${String(params.month).padStart(2, '0')}-${String(index + 1).padStart(4, '0')}`;

        return {
          id: `pi-${runId}-${emp.id}`,
          payrollRunId: runId,
          runId: runId,
          organizationId: emp.organizationId || 'org-coralgenz-01',
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeCode: emp.id,
          departmentId: emp.departmentId,
          departmentName: emp.departmentName || 'General',
          designationId: emp.designationId,
          designationTitle: emp.designationTitle || 'Associate',
          panNumber: emp.panNumber || emp.bankDetails?.panNumber || '',
          payslipNumber: defaultPayslipNumber,
          refNo: defaultPayslipNumber,
          
          totalWorkingDays: 30,
          daysPresent: 30,
          daysOnLeave: 0,
          daysLossOfPay: 0,
          
          basicSalary: basic,
          hra: hra,
          conveyanceAllowance: conveyance,
          medicalAllowance: medical,
          specialAllowance: special,
          performanceBonus: 0,
          overtimeHours: 0,
          overtimePay: 0,
          otherEarnings: 0,
          grossSalary: monthlyGross,
          
          providentFund: pf,
          esi: 0,
          professionalTax: pt,
          incomeTaxTDS: tds,
          lossOfPayDeduction: 0,
          loanDeduction: 0,
          advanceDeduction: 0,
          otherDeductions: 0,
          totalDeductions: deductions,
          employerPf: pf,
          employerEsi: 0,
          netSalary: net,
          
          bankName: emp.bankDetails?.bankName || '',
          bankAccountNumber: emp.bankDetails?.accountNumber || '',
          ifscCode: emp.bankDetails?.ifscCode || '',
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending',
          status: 'calculated'
        };
      });

      const newRun: PayrollRun = {
        id: runId,
        organizationId: 'org-coralgenz-01',
        periodName: params.periodName || `${params.month}/${params.year}`,
        month: params.month,
        year: params.year,
        startDate: params.startDate || `${params.year}-${String(params.month).padStart(2, '0')}-01`,
        endDate: params.endDate || `${params.year}-${String(params.month).padStart(2, '0')}-28`,
        paymentDate: params.paymentDate || `${params.year}-${String(params.month).padStart(2, '0')}-28`,
        totalEmployees: activeEmployees.length,
        totalGrossPayroll: totalGross,
        totalNetPayroll: totalNet,
        totalDeductions: totalDeductions,
        totalPfContribution: Math.max(0, totalDeductions - totalTaxes),
        totalEsiContribution: 0,
        totalTdsDeduction: totalTaxes,
        processedCount: payrollItems.length,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save draft run and draft items to Firestore
      await setDoc(doc(db, 'payrollRuns', runId), cleanFirestoreData(newRun));
      for (const item of payrollItems) {
        await setDoc(doc(db, 'payrollItems', item.id), cleanFirestoreData(item));
      }

      return { success: true, run: newRun, items: payrollItems };
    } catch (err: any) {
      console.error('Firestore processPayroll error:', err.message);
      return { success: false, error: err.message };
    }
  }

  public static async lockAndPublishPayroll(params: LockPayrollParams): Promise<{
    success: boolean;
    run?: PayrollRun;
    payslips?: Payslip[];
    error?: string;
  }> {
    if (!isFirebaseConfigured || !db || !params.runId) return { success: false, error: 'Invalid config or runId' };

    try {
      // 1. Get Run
      const runRef = doc(db, 'payrollRuns', params.runId);
      const runSnap = await getDoc(runRef);
      if (!runSnap.exists()) return { success: false, error: 'Run not found' };
      const run = { ...runSnap.data(), id: runSnap.id } as PayrollRun;

      // 2. Use passed items if available (contains user's custom edits and ref numbers), otherwise fetch from Firestore
      let items: PayrollItem[] = params.items && params.items.length > 0 ? params.items : [];
      if (items.length === 0) {
        const itemsSnap = await getDocs(query(collection(db, 'payrollItems'), where('payrollRunId', '==', params.runId)));
        itemsSnap.forEach(d => items.push({ ...d.data(), id: d.id } as PayrollItem));
      }

      const payslips: Payslip[] = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      // 3. Generate Payslips and Update Items with custom edits
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const payslipNumber = item.payslipNumber || item.refNo || `CGG-PS-${run.year}-${String(run.month).padStart(2, '0')}-${String(idx + 1).padStart(4, '0')}`;
        
        // Update item in Firestore with full edited values
        const updatedItem = cleanFirestoreData({
          ...item,
          payslipNumber,
          refNo: payslipNumber,
          status: 'approved'
        });
        await setDoc(doc(db, 'payrollItems', item.id), updatedItem);

        totalGross += Number(item.grossSalary) || 0;
        totalNet += Number(item.netSalary) || 0;
        totalDeductions += Number(item.totalDeductions) || 0;
        
        // Generate payslip with full customizable breakdown
        const payslip = cleanFirestoreData({
          id: `ps-${params.runId}-${item.employeeId}`,
          payslipNumber,
          payrollRunId: params.runId,
          organizationId: item.organizationId || 'org-coralgenz-01',
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          employeeCode: item.employeeCode,
          departmentName: item.departmentName,
          designationTitle: item.designationTitle,
          panNumber: item.panNumber || '',
          bankName: item.bankName || '',
          maskedAccountNumber: item.bankAccountNumber ? `•••• •••• ${item.bankAccountNumber.slice(-4)}` : '••••',
          ifscCode: item.ifscCode || '',
          month: run.month,
          year: run.year,
          paymentDate: run.paymentDate,
          periodName: run.periodName,
          payDate: run.paymentDate,
          
          workingDays: Number(item.totalWorkingDays) || 0,
          presentDays: Number(item.daysPresent) || 0,
          leaveDays: Number(item.daysOnLeave) || 0,
          lossOfPayDays: Number(item.daysLossOfPay) || 0,
          
          earnings: {
            basic: Number(item.basicSalary) || 0,
            hra: Number(item.hra) || 0,
            conveyance: Number(item.conveyanceAllowance) || 0,
            medical: Number(item.medicalAllowance) || 0,
            specialAllowance: Number(item.specialAllowance) || 0,
            bonus: Number(item.performanceBonus) || 0,
            overtime: Number(item.overtimePay) || 0,
            other: Number(item.otherEarnings) || 0
          },
          deductions: {
            pf: Number(item.providentFund) || 0,
            esi: Number(item.esi) || 0,
            professionalTax: Number(item.professionalTax) || 0,
            incomeTax: Number(item.incomeTaxTDS) || 0,
            lossOfPay: Number(item.lossOfPayDeduction) || 0,
            loan: 0,
            advance: 0,
            other: Number(item.otherDeductions) || 0
          },
          
          grossSalary: Number(item.grossSalary) || 0,
          totalDeductions: Number(item.totalDeductions) || 0,
          netSalary: Number(item.netSalary) || 0,
          
          status: 'locked',
          locked: true,
          lockedAt: new Date().toISOString(),
          lockedBy: params.approvedBy || 'usr-superadmin-01',
          lockedByName: params.approvedByName || 'Super Admin',
          generatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }) as Payslip;

        await setDoc(doc(db, 'payslips', payslip.id), payslip);
        payslips.push(payslip);
      }

      // 4. Update Run Status and actual totals
      await updateDoc(runRef, {
        status: 'locked',
        totalGrossPayroll: totalGross,
        totalNetPayroll: totalNet,
        totalDeductions: totalDeductions,
        approvedBy: params.approvedBy || 'system',
        approvedByName: params.approvedByName || 'Super Admin',
        updatedAt: new Date().toISOString()
      });

      const updatedRun: PayrollRun = {
        ...run,
        status: 'locked',
        totalGrossPayroll: totalGross,
        totalNetPayroll: totalNet,
        totalDeductions: totalDeductions,
      };

      // 5. Audit Log
      try {
        await AuditService.logAction({
          action: 'PAYROLL_LOCKED',
          module: 'payroll',
          details: `Locked & published payroll for ${run.periodName} (${payslips.length} payslips dispatched). Total Net: ₹${totalNet.toLocaleString('en-IN')}`,
          userId: params.approvedBy || 'usr-superadmin-01',
          userName: params.approvedByName || 'Super Admin',
          userRole: 'super_admin',
          recordId: params.runId,
          recordTitle: `Payroll ${run.periodName}`,
        });
      } catch {}

      return { success: true, run: updatedRun, payslips };
    } catch (err: any) {
      console.error('Firestore lockAndPublish error:', err.message);
      return { success: false, error: err.message };
    }
  }

  public static async getPayslips(employeeId?: string): Promise<Payslip[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      let q = query(collection(db, 'payslips'));
      if (employeeId) {
        q = query(collection(db, 'payslips'), where('employeeId', '==', employeeId));
      }
      const snap = await getDocs(q);
      const payslips: Payslip[] = [];
      snap.forEach((d) => payslips.push({ ...d.data(), id: d.id } as Payslip));
      return payslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    } catch (error: any) {
      console.error('Firestore getPayslips error:', error.message);
      return [];
    }
  }

  public static async getPayslipById(id: string): Promise<Payslip | null> {
    if (!id || !isFirebaseConfigured || !db) return null;

    try {
      const docSnap = await getDoc(doc(db, 'payslips', id));
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Payslip;
      }
    } catch (error: any) {
      console.error('Firestore getPayslipById error:', error.message);
    }
    return null;
  }

  /**
   * Lock a single payslip with audit trail
   */
  public static async lockPayslip(
    id: string,
    adminUser: { id: string; name: string; role?: string }
  ): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    try {
      const docRef = doc(db, 'payslips', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      const data = snap.data() as Payslip;

      const updates = {
        status: 'locked',
        locked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: adminUser.id,
        lockedByName: adminUser.name,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, cleanFirestoreData(updates));

      await AuditService.logAction({
        action: 'PAYSLIP_LOCKED',
        module: 'payroll',
        details: `Locked payslip ${data.payslipNumber || id} for employee ${data.employeeName} (${data.employeeId})`,
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role || 'admin',
        recordId: id,
        recordTitle: `Payslip ${data.payslipNumber || id}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore lockPayslip error:', err.message);
      return false;
    }
  }

  /**
   * Unlock a single payslip with audit trail & reason
   */
  public static async unlockPayslip(
    id: string,
    adminUser: { id: string; name: string; role?: string },
    reason: string
  ): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    try {
      const docRef = doc(db, 'payslips', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      const data = snap.data() as Payslip;

      const updates = {
        status: 'published',
        locked: false,
        unlockedAt: new Date().toISOString(),
        unlockedBy: adminUser.id,
        unlockedByName: adminUser.name,
        unlockReason: reason,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, cleanFirestoreData(updates));

      await AuditService.logAction({
        action: 'PAYSLIP_UNLOCKED',
        module: 'payroll',
        details: `Unlocked payslip ${data.payslipNumber || id} for employee ${data.employeeName} (${data.employeeId}). Reason: ${reason}`,
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role || 'admin',
        recordId: id,
        recordTitle: `Payslip ${data.payslipNumber || id}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore unlockPayslip error:', err.message);
      return false;
    }
  }

  /**
   * Admin Override: Edit a locked payslip with required audit reason & recalculated totals
   */
  public static async updateLockedPayslip(
    id: string,
    updates: Partial<Payslip>,
    adminUser: { id: string; name: string; role?: string },
    reason: string
  ): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    try {
      const docRef = doc(db, 'payslips', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      const oldData = snap.data() as Payslip;

      const mergedPayload = cleanFirestoreData({
        ...oldData,
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: adminUser.id,
        lastModifiedByName: adminUser.name,
        lastOverrideReason: reason,
      });

      await setDoc(docRef, mergedPayload, { merge: true });

      // Record detailed Audit Log for administrative override
      await AuditService.logAction({
        action: 'LOCKED_PAYSLIP_EDITED',
        module: 'payroll',
        details: `Administrative override edit on locked payslip ${oldData.payslipNumber || id} for ${oldData.employeeName}. Reason: ${reason}`,
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role || 'admin',
        recordId: id,
        recordTitle: `Payslip ${oldData.payslipNumber || id}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore updateLockedPayslip error:', err.message);
      return false;
    }
  }

  /**
   * Admin Delete: Delete a payslip (even if locked) with required audit reason
   */
  public static async deletePayslip(
    id: string,
    adminUser: { id: string; name: string; role?: string },
    reason: string
  ): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    try {
      const docRef = doc(db, 'payslips', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      const data = snap.data() as Payslip;

      await deleteDoc(docRef);

      // Also clean up or void associated payroll item if present
      try {
        const itemSnap = await getDocs(query(collection(db, 'payrollItems'), where('employeeId', '==', data.employeeId), where('payrollRunId', '==', data.payrollRunId)));
        for (const iDoc of itemSnap.docs) {
          await deleteDoc(doc(db, 'payrollItems', iDoc.id));
        }
      } catch {}

      await AuditService.logAction({
        action: 'LOCKED_PAYSLIP_DELETED',
        module: 'payroll',
        details: `Admin deleted payslip ${data.payslipNumber || id} for ${data.employeeName} (${data.employeeId}). Reason: ${reason}`,
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role || 'admin',
        recordId: id,
        recordTitle: `Payslip ${data.payslipNumber || id}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore deletePayslip error:', err.message);
      return false;
    }
  }

  /**
   * Delete a complete payroll cycle run with cascading deletion of its items, payslips, and audit logging
   */
  public static async deletePayrollRun(
    runId: string,
    adminUser?: { id: string; name: string; role?: string },
    reason?: string
  ): Promise<boolean> {
    if (!runId || !isFirebaseConfigured || !db) return false;

    try {
      // 1. Get Run info for details
      const runRef = doc(db, 'payrollRuns', runId);
      const runSnap = await getDoc(runRef);
      const periodName = runSnap.exists() ? (runSnap.data().periodName || runId) : runId;

      // 2. Delete Payroll Run document
      await deleteDoc(runRef);

      // 3. Cascade delete associated payroll items
      try {
        const itemsSnap1 = await getDocs(query(collection(db, 'payrollItems'), where('payrollRunId', '==', runId)));
        for (const d of itemsSnap1.docs) {
          await deleteDoc(doc(db, 'payrollItems', d.id));
        }
        const itemsSnap2 = await getDocs(query(collection(db, 'payrollItems'), where('runId', '==', runId)));
        for (const d of itemsSnap2.docs) {
          await deleteDoc(doc(db, 'payrollItems', d.id));
        }
      } catch (err) {
        console.warn('Items deletion warning:', err);
      }

      // 4. Cascade delete associated payslips
      try {
        const payslipsSnap = await getDocs(query(collection(db, 'payslips'), where('payrollRunId', '==', runId)));
        for (const d of payslipsSnap.docs) {
          await deleteDoc(doc(db, 'payslips', d.id));
        }
      } catch (err) {
        console.warn('Payslips deletion warning:', err);
      }

      // 5. Create Audit Log
      try {
        await AuditService.logAction({
          action: 'PAYROLL_RUN_DELETED',
          module: 'payroll',
          details: `Deleted historical payroll cycle ${periodName} (${runId}) and cascaded all associated line items and payslips. Reason: ${reason || 'Administrative removal'}`,
          userId: adminUser?.id || 'usr-superadmin-01',
          userName: adminUser?.name || 'Super Admin',
          userRole: adminUser?.role || 'super_admin',
          recordId: runId,
          recordTitle: `Payroll Run ${periodName}`,
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore deletePayrollRun error:', err.message);
      return false;
    }
  }
}
