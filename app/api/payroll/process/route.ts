import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, addDoc } from 'firebase/firestore';
import { calculateEmployeePayroll, EmployeeAttendanceData } from '@/lib/payroll/engine';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { serverDb } from '@/lib/server/server-db';
import { Employee, PayrollItem, PayrollRun } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      periodName = `Salary Cycle - ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      startDate = `${year}-${String(month).padStart(2, '0')}-01`,
      endDate = `${year}-${String(month).padStart(2, '0')}-28`,
      paymentDate = `${year}-${String(month).padStart(2, '0')}-30`,
      processedBy = 'usr-superadmin-01',
      processedByName = 'Super Admin',
    } = body;

    // 1. Fetch active employees from persistent server database
    let activeEmployees = serverDb.getEmployees();

    if (activeEmployees.length === 0 && adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').get();
        snap.forEach((docSnap) => {
          const emp = docSnap.data() as Employee;
          if (emp.status !== 'inactive') {
            serverDb.saveEmployee(emp);
          }
        });
        activeEmployees = serverDb.getEmployees();
      } catch (err: any) {
        console.warn('Admin Firestore fetch employees notice:', err.message);
      }
    }

    if (activeEmployees.length === 0 && db) {
      try {
        const snap = await getDocs(collection(db, 'employees'));
        snap.forEach((docSnap) => {
          const emp = docSnap.data() as Employee;
          if (emp.status !== 'inactive') {
            serverDb.saveEmployee(emp);
          }
        });
        activeEmployees = serverDb.getEmployees();
      } catch (err: any) {
        console.warn('Client Firestore fetch employees notice:', err.message);
      }
    }

    if (activeEmployees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found in the directory. Please add at least one employee before running payroll.' },
        { status: 400 }
      );
    }

    const runId = `run-${year}-${String(month).padStart(2, '0')}-${Date.now()}`;
    const items: PayrollItem[] = [];

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalEmployerPf = 0;
    let totalEmployerEsi = 0;

    // 2. Compute payroll for each active employee
    for (const emp of activeEmployees) {
      const attendance: EmployeeAttendanceData = {
        workingDays: 22,
        presentDays: 22,
        leaveDays: 0,
        lossOfPayDays: 0,
        overtimeHours: 0,
      };

      const computed = calculateEmployeePayroll(emp, attendance);

      const item: PayrollItem = {
        ...computed,
        id: `item-${runId}-${emp.id}`,
        payrollRunId: runId,
        organizationId: emp.organizationId || 'org-coralgenz-01',
        status: 'calculated',
      };

      items.push(item);

      totalGrossPay += item.grossSalary;
      totalDeductions += item.totalDeductions;
      totalNetPay += item.netSalary;
      totalEmployerPf += item.employerPf;
      totalEmployerEsi += item.employerEsi;
    }

    const run: PayrollRun = cleanFirestoreData({
      id: runId,
      organizationId: 'org-coralgenz-01',
      month: Number(month),
      year: Number(year),
      periodName,
      startDate,
      endDate,
      paymentDate,
      status: 'calculated',
      totalEmployees: items.length,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      totalEmployerPf,
      totalEmployerEsi,
      totalCostToCompany: totalGrossPay + totalEmployerPf + totalEmployerEsi,
      currency: 'INR',
      processedBy,
      processedByName,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Persist to Server Database
    const savedRun = serverDb.savePayrollRun(run);
    serverDb.savePayrollItems(items);

    // 4. Save PayrollRun and PayrollItems to Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('payrollRuns').doc(runId).set(savedRun, { merge: true });
        for (const item of items) {
          await adminDb.collection('payrollItems').doc(item.id).set(cleanFirestoreData(item), { merge: true });
        }
      } catch (err: any) {
        console.warn('Admin Firestore save payroll run notice:', err.message);
      }
    }

    if (db) {
      try {
        await setDoc(doc(db, 'payrollRuns', runId), savedRun, { merge: true });
        for (const item of items) {
          await setDoc(doc(db, 'payrollItems', item.id), cleanFirestoreData(item), { merge: true });
        }
      } catch (err: any) {
        console.warn('Client Firestore save payroll run notice:', err.message);
      }
    }

    // 5. Log Audit Event
    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: processedBy,
      userName: processedByName,
      userRole: 'super_admin',
      action: 'process_payroll',
      module: 'payroll',
      recordId: runId,
      recordTitle: periodName,
      details: `Calculated payroll cycle for ${items.length} employees with total net disbursement of ₹${totalNetPay.toLocaleString('en-IN')}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      run: savedRun,
      items,
      message: `Payroll for ${periodName} calculated successfully for ${items.length} employees.`,
    });
  } catch (error: any) {
    console.error('POST /api/payroll/process error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payroll on server' },
      { status: 500 }
    );
  }
}
