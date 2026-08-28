import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, getDoc, query, where, addDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { LeaveRequest, LeaveBalance } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const requests: LeaveRequest[] = [];
    let balance: LeaveBalance | null = null;

    // 1. Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('leaveRequests');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => requests.push(d.data() as LeaveRequest));

        if (employeeId) {
          const balSnap = await adminDb.collection('leaveBalances').doc(`lb-${employeeId}-2026`).get();
          if (balSnap.exists) {
            balance = balSnap.data() as LeaveBalance;
          }
        }

        if (requests.length > 0 || balance) {
          requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return NextResponse.json({ success: true, requests, balance });
        }
      } catch {}
    }

    // 2. Client Firestore
    if (db) {
      try {
        let q = query(collection(db, 'leaveRequests'));
        if (employeeId) {
          q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => requests.push(d.data() as LeaveRequest));

        if (employeeId) {
          const balDoc = await getDoc(doc(db, 'leaveBalances', `lb-${employeeId}-2026`));
          if (balDoc.exists()) {
            balance = balDoc.data() as LeaveBalance;
          }
        }

        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json({ success: true, requests, balance });
      } catch {}
    }

    return NextResponse.json({ success: true, requests: [], balance: null });
  } catch (error: any) {
    return NextResponse.json({ success: true, requests: [], balance: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'create', leaveRequest, updateData, requestId } = body;

    if (action === 'create' && leaveRequest) {
      const id = leaveRequest.id || `leave-${Date.now()}`;
      const newLeave: LeaveRequest = cleanFirestoreData({
        ...leaveRequest,
        id,
        status: leaveRequest.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          await adminDb.collection('leaveRequests').doc(id).set(newLeave, { merge: true });
        } catch {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'leaveRequests', id), newLeave, { merge: true });
        } catch {}
      }

      return NextResponse.json({ success: true, leaveRequest: newLeave });
    }

    if (action === 'update' && requestId && updateData) {
      const updates = cleanFirestoreData({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          await adminDb.collection('leaveRequests').doc(requestId).update(updates);
        } catch {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'leaveRequests', requestId), updates, { merge: true });
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Leave status updated' });
    }

    return NextResponse.json({ error: 'Invalid leave action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing leave' }, { status: 500 });
  }
}
