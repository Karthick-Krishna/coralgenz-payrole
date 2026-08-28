import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { EmployeeRequest } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const requests: EmployeeRequest[] = [];

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('requests');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => requests.push(d.data() as EmployeeRequest));
        if (requests.length > 0) {
          requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return NextResponse.json({ success: true, requests });
        }
      } catch {}
    }

    if (db) {
      try {
        let q = query(collection(db, 'requests'));
        if (employeeId) {
          q = query(collection(db, 'requests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => requests.push(d.data() as EmployeeRequest));
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json({ success: true, requests });
      } catch {}
    }

    return NextResponse.json({ success: true, requests: [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, requests: [] });
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('requests').doc(id).set(reqData, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'requests', id), reqData, { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, request: reqData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving request' }, { status: 500 });
  }
}
