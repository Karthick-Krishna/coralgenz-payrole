import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { AttendanceRecord } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const records: AttendanceRecord[] = [];

    // 1. Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let q: any = adminDb.collection('attendance');
        if (employeeId) q = q.where('employeeId', '==', employeeId);
        const snap = await q.get();
        snap.forEach((d: any) => records.push(d.data() as AttendanceRecord));
        if (records.length > 0) {
          records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return NextResponse.json({ success: true, records });
        }
      } catch {}
    }

    // 2. Client Firestore
    if (db) {
      try {
        let q = query(collection(db, 'attendance'));
        if (employeeId) {
          q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => records.push(d.data() as AttendanceRecord));
        if (records.length > 0) {
          records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return NextResponse.json({ success: true, records });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, records: [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, records: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record: AttendanceRecord = cleanFirestoreData({
      ...body,
      id: body.id || `att-${body.employeeId}-${body.date || new Date().toISOString().split('T')[0]}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('attendance').doc(record.id).set(record, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'attendance', record.id), record, { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving attendance' }, { status: 500 });
  }
}
