import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { EmployeeRequest } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    // 1. Sync from Admin Firestore if available
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('requests');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => {
          const r = d.data() as EmployeeRequest;
          if (r && r.id) serverDb.saveRequest(r);
        });
      } catch {}
    }

    // 2. Sync from Client Firestore if available
    if (db) {
      try {
        let q = query(collection(db, 'requests'));
        if (employeeId) {
          q = query(collection(db, 'requests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const r = d.data() as EmployeeRequest;
          if (r && r.id) serverDb.saveRequest(r);
        });
      } catch {}
    }

    // 3. Return from Server Database
    const requests = serverDb.getRequests(employeeId);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    const requests = serverDb.getRequests();
    return NextResponse.json({ success: true, requests });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `req-${Date.now()}`;
    const reqData: EmployeeRequest = cleanFirestoreData({
      ...body,
      id,
      status: body.status || 'submitted',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Persist to Server Database
    const savedReq = serverDb.saveRequest(reqData);

    // 2. Persist to Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('requests').doc(id).set(savedReq, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'requests', id), savedReq, { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, request: savedReq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving request' }, { status: 500 });
  }
}
