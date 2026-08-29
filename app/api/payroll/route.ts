import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { PayrollRun } from '@/types';

export async function GET() {
  try {
    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('payrollRuns').orderBy('createdAt', 'desc').get();
        snap.forEach((docSnap) => {
          const run = docSnap.data() as PayrollRun;
          if (run && run.id) serverDb.savePayrollRun(run);
        });
      } catch (err: any) {
        console.warn('Admin Firestore payrollRuns error:', err.message);
      }
    }

    // 2. Try Client Firestore SDK
    if (db) {
      try {
        const q = query(collection(db, 'payrollRuns'));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          const run = docSnap.data() as PayrollRun;
          if (run && run.id) serverDb.savePayrollRun(run);
        });
      } catch (err: any) {
        console.warn('Client Firestore payrollRuns error:', err.message);
      }
    }

    const runs = serverDb.getPayrollRuns();
    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    console.error('GET /api/payroll error:', error);
    const runs = serverDb.getPayrollRuns();
    return NextResponse.json({ success: true, runs });
  }
}
