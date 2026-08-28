import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Payslip } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Try Admin Firestore by document ID
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const docSnap = await adminDb.collection('payslips').doc(id).get();
        if (docSnap.exists) {
          return NextResponse.json({ success: true, payslip: docSnap.data() as Payslip });
        }

        // Try query by payslipNumber or id field
        const qSnap = await adminDb.collection('payslips').where('payslipNumber', '==', id).get();
        if (!qSnap.empty) {
          return NextResponse.json({ success: true, payslip: qSnap.docs[0].data() as Payslip });
        }
      } catch {}
    }

    // 2. Try Client Firestore SDK
    if (db) {
      try {
        const docSnap = await getDoc(doc(db, 'payslips', id));
        if (docSnap.exists()) {
          return NextResponse.json({ success: true, payslip: docSnap.data() as Payslip });
        }

        const q = query(collection(db, 'payslips'), where('payslipNumber', '==', id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return NextResponse.json({ success: true, payslip: qSnap.docs[0].data() as Payslip });
        }
      } catch {}
    }

    return NextResponse.json({ error: 'Payslip not found on server' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching payslip' }, { status: 500 });
  }
}
