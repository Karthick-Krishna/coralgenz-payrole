import { collection, doc, getDocs, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { PayrollRun, PayrollItem, Payslip } from '@/types';

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
  approvedBy?: string;
  approvedByName?: string;
}

export class PayrollService {
  /**
   * Fetch all payroll runs from server
   */
  public static async getPayrollRuns(): Promise<PayrollRun[]> {
    // 1. Try server API route
    try {
      const res = await fetch('/api/payroll', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.runs)) {
          return data.runs;
        }
      }
    } catch {}

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'payrollRuns'));
        const snap = await getDocs(q);
        const runs: PayrollRun[] = [];
        snap.forEach((d) => runs.push(d.data() as PayrollRun));
        return runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch {}
    }

    return [];
  }

  /**
   * Calculate payroll run for all active employees
   */
  public static async processPayrollRun(params: ProcessPayrollParams): Promise<{
    success: boolean;
    run?: PayrollRun;
    items?: PayrollItem[];
    error?: string;
  }> {
    try {
      const res = await fetch('/api/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to process payroll on server.' };
      }

      return { success: true, run: data.run, items: data.items };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while processing payroll.' };
    }
  }

  /**
   * Approve and lock payroll run & generate official payslips
   */
  public static async lockAndPublishPayroll(params: LockPayrollParams): Promise<{
    success: boolean;
    run?: PayrollRun;
    payslips?: Payslip[];
    error?: string;
  }> {
    try {
      const res = await fetch('/api/payroll/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to lock payroll on server.' };
      }

      return { success: true, run: data.run, payslips: data.payslips };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while locking payroll.' };
    }
  }

  /**
   * Fetch payslips for an employee or all payslips
   */
  public static async getPayslips(employeeId?: string): Promise<Payslip[]> {
    // 1. Try server API route
    try {
      const url = employeeId ? `/api/payslips?employeeId=${encodeURIComponent(employeeId)}` : '/api/payslips';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payslips)) {
          return data.payslips;
        }
      }
    } catch {}

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, 'payslips'));
        if (employeeId) {
          q = query(collection(db, 'payslips'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        const payslips: Payslip[] = [];
        snap.forEach((d) => payslips.push(d.data() as Payslip));
        return payslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      } catch {}
    }

    return [];
  }

  /**
   * Fetch single payslip by ID
   */
  public static async getPayslipById(id: string): Promise<Payslip | null> {
    if (!id) return null;

    // 1. Try server API route
    try {
      const res = await fetch(`/api/payslips/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.payslip) {
          return data.payslip;
        }
      }
    } catch {}

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const docSnap = await getDoc(doc(db, 'payslips', id));
        if (docSnap.exists()) {
          return docSnap.data() as Payslip;
        }
      } catch {}
    }

    return null;
  }
}
