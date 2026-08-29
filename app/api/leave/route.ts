import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { LeaveRequest, LeaveBalance } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    // 1. Sync from Admin Firestore if available
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('leaveRequests');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => {
          const l = d.data() as LeaveRequest;
          if (l && l.id) serverDb.saveLeaveRequest(l);
        });
      } catch {}
    }

    // 2. Sync from Client Firestore if available
    if (db) {
      try {
        let q = query(collection(db, 'leaveRequests'));
        if (employeeId) {
          q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const l = d.data() as LeaveRequest;
          if (l && l.id) serverDb.saveLeaveRequest(l);
        });
      } catch {}
    }

    // 3. Return from Server Database
    const requests = serverDb.getLeaveRequests(employeeId);
    const balance = employeeId ? serverDb.getLeaveBalance(employeeId) : null;

    return NextResponse.json({ success: true, requests, balance });
  } catch (error: any) {
    const requests = serverDb.getLeaveRequests();
    return NextResponse.json({ success: true, requests, balance: null });
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
        createdAt: leaveRequest.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 1. Persist to Server Database
      const savedLeave = serverDb.saveLeaveRequest(newLeave);

      // 2. Persist to Firestore
      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          await adminDb.collection('leaveRequests').doc(id).set(savedLeave, { merge: true });
        } catch {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'leaveRequests', id), savedLeave, { merge: true });
        } catch {}
      }

      return NextResponse.json({ success: true, leaveRequest: savedLeave });
    }

    if (action === 'update' && requestId && updateData) {
      const existing = serverDb.getLeaveRequests().find((r) => r.id === requestId);
      const merged: LeaveRequest = cleanFirestoreData({
        ...(existing || {}),
        ...updateData,
        id: requestId,
        updatedAt: new Date().toISOString(),
      });

      // 1. Persist to Server Database (will also auto-deduct balance if approved)
      const savedLeave = serverDb.saveLeaveRequest(merged);

      // 2. Persist to Firestore
      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          await adminDb.collection('leaveRequests').doc(requestId).set(savedLeave, { merge: true });
        } catch {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'leaveRequests', requestId), savedLeave, { merge: true });
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Leave status updated', leaveRequest: savedLeave });
    }

    return NextResponse.json({ error: 'Invalid leave action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing leave' }, { status: 500 });
  }
}
