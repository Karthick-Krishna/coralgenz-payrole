import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
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

      const items: PayrollItem[] = activeEmployees.map((emp, idx) => {
        const gross = emp.currentMonthlyGross || 0;
        const basic = Math.round(gross * 0.4);
        const hra = Math.round(gross * 0.2);
        const specialAllowance = gross - basic - hra;
        
        const pf = Math.round(basic * 0.12);
        const tax = Math.round(gross * 0.05);
        const deductions = pf + tax;
        
        const net = gross - deductions;

        totalGross += gross;
        totalNet += net;
        totalDeductions += deductions;
        totalTaxes += tax;

        const defaultRefNo = `CGG-PS-${params.year}-${String(params.month).padStart(2, "0")}-${String(idx + 1).padStart(4, "0")}`;

        return cleanFirestoreData({
          id: `pi-${runId}-${emp.id}`,
          payrollRunId: runId,
          organizationId: emp.organizationId || 'org-1',
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeCode: emp.id,
          departmentName: emp.departmentName || '',
          designationTitle: emp.designationTitle || '',
          panNumber: emp.panNumber || emp.bankDetails?.panNumber || '',
          payslipNumber: defaultRefNo,
          refNo: defaultRefNo,
          bankAccountNumber: emp.bankDetails?.accountNumber || '',
          bankName: emp.bankDetails?.bankName || '',
          ifscCode: emp.bankDetails?.ifscCode || '',
          totalWorkingDays: 30,
          daysPresent: 30,
          daysOnLeave: 0,
          daysLossOfPay: 0,
          overtimeHours: 0,
          basicSalary: basic,
          hra: hra,
          conveyanceAllowance: 0,
          medicalAllowance: 0,
          specialAllowance: specialAllowance,
          performanceBonus: 0,
          overtimePay: 0,
          otherEarnings: 0,
          grossSalary: gross,
          providentFund: pf,
          esi: 0,
          professionalTax: 0,
          incomeTaxTDS: tax,
          lossOfPayDeduction: 0,
          loanDeduction: 0,
          advanceDeduction: 0,
          otherDeductions: 0,
          totalDeductions: deductions,
          employerPf: pf,
          employerEsi: 0,
          netSalary: net,
          status: 'calculated'
        }) as PayrollItem;
      });

      const run = cleanFirestoreData({
        id: runId,
        organizationId: activeEmployees[0]?.organizationId || 'org-1',
        month: params.month,
        year: params.year,
        periodName: params.periodName || `${params.month}/${params.year}`,
        startDate: params.startDate || new Date(params.year, params.month - 1, 1).toISOString(),
        endDate: params.endDate || new Date(params.year, params.month, 0).toISOString(),
        paymentDate: params.paymentDate || new Date(params.year, params.month, 5).toISOString(),
        status: 'draft',
        totalEmployees: activeEmployees.length,
        totalGrossPayroll: totalGross,
        totalNetPayroll: totalNet,
        totalDeductions: totalDeductions,
        totalPfContribution: totalDeductions - totalTaxes, // Approximation
        totalEsiContribution: 0,
        totalTdsDeduction: totalTaxes,
        processedCount: items.length,
        approvedBy: '',
        processedBy: params.processedBy || 'system',
        processedByName: params.processedByName || 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }) as PayrollRun;

      // Save Draft Run
      await setDoc(doc(db, 'payrollRuns', runId), run);
      
      // Save Draft Items
      for (const item of items) {
        await setDoc(doc(db, 'payrollItems', item.id), item);
      }

      return { success: true, run, items };
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
            tds: Number(item.incomeTaxTDS) || 0,
            incomeTax: Number(item.incomeTaxTDS) || 0,
            lossOfPay: Number(item.lossOfPayDeduction) || 0,
            other: Number(item.otherDeductions) || 0
          },
          
          grossSalary: Number(item.grossSalary) || 0,
          totalDeductions: Number(item.totalDeductions) || 0,
          netSalary: Number(item.netSalary) || 0,
          
          status: 'published',
          generatedAt: new Date().toISOString()
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
}
