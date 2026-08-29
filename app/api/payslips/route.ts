import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { Payslip } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let qRef: any = adminDb.collection('payslips');
        if (employeeId) {
          qRef = qRef.where('employeeId', '==', employeeId);
        }
        const snap = await qRef.get();
        snap.forEach((d: any) => {
          const p = d.data() as Payslip;
          if (p && p.id) serverDb.savePayslip(p);
        });
      } catch (err: any) {
        console.warn('Admin Firestore get payslips notice:', err.message);
      }
    }

    // 2. Try Client Firestore SDK
    if (db) {
      try {
        let q = query(collection(db, 'payslips'));
        if (employeeId) {
          q = query(collection(db, 'payslips'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const p = d.data() as Payslip;
          if (p && p.id) serverDb.savePayslip(p);
        });
      } catch (err: any) {
        console.warn('Client Firestore get payslips notice:', err.message);
      }
    }

    const payslips = serverDb.getPayslips(employeeId);
    return NextResponse.json({ success: true, payslips });
  } catch (error: any) {
    console.error('GET /api/payslips error:', error);
    const payslips = serverDb.getPayslips();
    return NextResponse.json({ success: true, payslips });
  }
}
