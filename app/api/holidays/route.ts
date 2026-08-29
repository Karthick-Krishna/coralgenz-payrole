import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Holiday } from '@/types';

export async function GET() {
  try {
    const holidays = serverDb.getHolidays();
    return NextResponse.json({ success: true, holidays });
  } catch (error: any) {
    return NextResponse.json({ success: true, holidays: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.date) {
      return NextResponse.json({ error: 'Holiday name and date are required' }, { status: 400 });
    }

    const saved = serverDb.saveHoliday(body);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('holidays').doc(saved.id).set(cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'holidays', saved.id), cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, holiday: saved });
  } catch (error: any) {
    console.error('POST /api/holidays error:', error);
    return NextResponse.json({ error: error.message || 'Error saving holiday' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    serverDb.deleteHoliday(id);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('holidays').doc(id).delete();
      } catch {}
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'holidays', id));
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Holiday removed from calendar' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting holiday' }, { status: 500 });
  }
}
