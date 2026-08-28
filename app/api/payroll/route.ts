import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { PayrollRun } from '@/types';

export async function GET() {
  try {
    const runs: PayrollRun[] = [];

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('payrollRuns').orderBy('createdAt', 'desc').get();
        snap.forEach((docSnap) => {
          runs.push(docSnap.data() as PayrollRun);
        });
        if (runs.length > 0) {
          return NextResponse.json({ success: true, runs });
        }
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
          runs.push(docSnap.data() as PayrollRun);
        });
        if (runs.length > 0) {
          runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return NextResponse.json({ success: true, runs });
        }
      } catch (err: any) {
        console.warn('Client Firestore payrollRuns error:', err.message);
      }
    }

    return NextResponse.json({ success: true, runs: [] });
  } catch (error: any) {
    console.error('GET /api/payroll error:', error);
    return NextResponse.json({ success: true, runs: [] });
  }
}
