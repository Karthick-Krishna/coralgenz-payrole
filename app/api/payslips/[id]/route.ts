import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { Payslip } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Payslip ID is required' }, { status: 400 });
    }

    // 1. Try persistent Server Database
    let payslip: Payslip | null = serverDb.getPayslipById(id);

    // 2. Try Admin Firestore by document ID
    if (!payslip && adminDb && typeof adminDb.collection === 'function') {
      try {
        const docSnap = await adminDb.collection('payslips').doc(id).get();
        if (docSnap.exists) {
          payslip = docSnap.data() as Payslip;
          serverDb.savePayslip(payslip);
        } else {
          const qSnap = await adminDb.collection('payslips').where('payslipNumber', '==', id).get();
          if (!qSnap.empty) {
            payslip = qSnap.docs[0].data() as Payslip;
            serverDb.savePayslip(payslip);
          }
        }
      } catch {}
    }

    // 3. Try Client Firestore SDK
    if (!payslip && db) {
      try {
        const docSnap = await getDoc(doc(db, 'payslips', id));
        if (docSnap.exists()) {
          payslip = docSnap.data() as Payslip;
          serverDb.savePayslip(payslip);
        } else {
          const q = query(collection(db, 'payslips'), where('payslipNumber', '==', id));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            payslip = qSnap.docs[0].data() as Payslip;
            serverDb.savePayslip(payslip);
          }
        }
      } catch {}
    }

    // 4. Fallback search by substring matching
    if (!payslip) {
      const allPayslips = serverDb.getPayslips();
      const match = allPayslips.find(
        (p) => p.id === id || p.payslipNumber === id || p.id.includes(id) || id.includes(p.id)
      );
      if (match) {
        payslip = match;
      }
    }

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found on server' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payslip });
  } catch (error: any) {
    console.error('GET /api/payslips/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Error fetching payslip' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    serverDb.deletePayslip(id);
    return NextResponse.json({ success: true, message: 'Payslip deleted from server' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting payslip' }, { status: 500 });
  }
}
