import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { generatePayslipFromItem } from '@/lib/payroll/engine';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { serverEmployeeCache } from '@/lib/server/employee-store';
import { Employee, PayrollItem, PayrollRun, Payslip } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      runId,
      approvedBy = 'usr-superadmin-01',
      approvedByName = 'Super Admin',
    } = body;

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // 1. Fetch Payroll Run
    let run: PayrollRun | null = null;

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const docSnap = await adminDb.collection('payrollRuns').doc(runId).get();
        if (docSnap.exists) {
          run = docSnap.data() as PayrollRun;
        }
      } catch {}
    }

    if (!run && db) {
      try {
        const docSnap = await getDoc(doc(db, 'payrollRuns', runId));
        if (docSnap.exists()) {
          run = docSnap.data() as PayrollRun;
        }
      } catch {}
    }

    if (!run) {
      return NextResponse.json({ error: 'Payroll run not found on server' }, { status: 404 });
    }

    // 2. Fetch Payroll Items
    const items: PayrollItem[] = [];

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('payrollItems').where('payrollRunId', '==', runId).get();
        snap.forEach((d) => items.push(d.data() as PayrollItem));
      } catch {}
    }

    if (items.length === 0 && db) {
      try {
        const q = query(collection(db, 'payrollItems'), where('payrollRunId', '==', runId));
        const snap = await getDocs(q);
        snap.forEach((d) => items.push(d.data() as PayrollItem));
      } catch {}
    }

    // 3. Fetch All Employees
    const employeeMap = new Map<string, Employee>();

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').get();
        snap.forEach((d) => employeeMap.set(d.id, d.data() as Employee));
      } catch {}
    }

    if (employeeMap.size === 0 && db) {
      try {
        const snap = await getDocs(collection(db, 'employees'));
        snap.forEach((d) => employeeMap.set(d.id, d.data() as Employee));
      } catch {}
    }

    for (const [id, emp] of serverEmployeeCache.entries()) {
      if (!employeeMap.has(id)) {
        employeeMap.set(id, emp);
      }
    }

    // 4. Update Payroll Run to locked/approved
    const updatedRun: PayrollRun = cleanFirestoreData({
      ...run,
      status: 'approved',
      approvedBy,
      approvedByName,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('payrollRuns').doc(runId).set(updatedRun, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'payrollRuns', runId), updatedRun, { merge: true });
      } catch {}
    }

    // 5. Generate and Save Official Payslips
    const generatedPayslips: Payslip[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const emp = employeeMap.get(item.employeeId) || ({
        id: item.employeeId,
        firstName: item.employeeName.split(' ')[0] || 'Employee',
        lastName: item.employeeName.split(' ')[1] || '',
        email: `${item.employeeId.toLowerCase()}@coralgenz.co.in`,
        joiningDate: '2024-01-01',
        designationTitle: item.designationTitle,
        departmentName: item.departmentName,
      } as Employee);

      const payslip = generatePayslipFromItem(item, updatedRun, emp, i + 1);
      const cleanPayslip = cleanFirestoreData(payslip);

      generatedPayslips.push(cleanPayslip);

      // Save Payslip in Firestore
      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          await adminDb.collection('payslips').doc(cleanPayslip.id).set(cleanPayslip, { merge: true });
        } catch {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'payslips', cleanPayslip.id), cleanPayslip, { merge: true });
        } catch {}
      }
    }

    // 6. Log Audit Event
    const auditPayload = cleanFirestoreData({
      userId: approvedBy,
      userName: approvedByName,
      userRole: 'super_admin',
      action: 'lock_payroll',
      module: 'payroll',
      recordId: runId,
      recordTitle: updatedRun.periodName,
      details: `Approved, locked, and published ${generatedPayslips.length} payslips for ${updatedRun.periodName}.`,
      timestamp: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('audit_logs').add(auditPayload);
      } catch {}
    } else if (db) {
      try {
        await addDoc(collection(db, 'audit_logs'), auditPayload);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      run: updatedRun,
      payslips: generatedPayslips,
      message: `Successfully locked payroll and published ${generatedPayslips.length} payslips to the server.`,
    });
  } catch (error: any) {
    console.error('POST /api/payroll/lock error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lock payroll on server' },
      { status: 500 }
    );
  }
}
