import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Payslip } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const payslips: Payslip[] = [];

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let qRef: any = adminDb.collection('payslips');
        if (employeeId) {
          qRef = qRef.where('employeeId', '==', employeeId);
        }
        const snap = await qRef.get();
        snap.forEach((d: any) => payslips.push(d.data() as Payslip));
        if (payslips.length > 0) {
          payslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
          return NextResponse.json({ success: true, payslips });
        }
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
        snap.forEach((d) => payslips.push(d.data() as Payslip));
        if (payslips.length > 0) {
          payslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
          return NextResponse.json({ success: true, payslips });
        }
      } catch (err: any) {
        console.warn('Client Firestore get payslips notice:', err.message);
      }
    }

    return NextResponse.json({ success: true, payslips: [] });
  } catch (error: any) {
    console.error('GET /api/payslips error:', error);
    return NextResponse.json({ success: true, payslips: [] });
  }
}
