import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { AttendanceRecord } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    // 1. Sync from Admin Firestore if available
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('attendance');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => {
          const rec = d.data() as AttendanceRecord;
          if (rec && rec.id) serverDb.saveAttendance(rec);
        });
      } catch {}
    }

    // 2. Sync from Client Firestore if available
    if (db) {
      try {
        let q = query(collection(db, 'attendance'));
        if (employeeId) {
          q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const rec = d.data() as AttendanceRecord;
          if (rec && rec.id) serverDb.saveAttendance(rec);
        });
      } catch {}
    }

    // 3. Return from Server Database
    const records = serverDb.getAttendance(employeeId);
    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    const records = serverDb.getAttendance();
    return NextResponse.json({ success: true, records });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record: AttendanceRecord = cleanFirestoreData({
      ...body,
      id: body.id || `att-${body.employeeId}-${body.date || new Date().toISOString().split('T')[0]}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Persist to Server Database
    const savedRec = serverDb.saveAttendance(record);

    // 2. Persist to Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('attendance').doc(savedRec.id).set(savedRec, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'attendance', savedRec.id), savedRec, { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, record: savedRec });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving attendance' }, { status: 500 });
  }
}
