import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Announcement } from '@/types';

export async function GET() {
  try {
    const announcements: Announcement[] = [];

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('announcements').get();
        snap.forEach((d) => announcements.push(d.data() as Announcement));
        if (announcements.length > 0) {
          announcements.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
          return NextResponse.json({ success: true, announcements });
        }
      } catch {}
    }

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        snap.forEach((d) => announcements.push(d.data() as Announcement));
        if (announcements.length > 0) {
          announcements.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
          return NextResponse.json({ success: true, announcements });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, announcements: [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, announcements: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `ann-${Date.now()}`;
    const announcement: Announcement = cleanFirestoreData({
      ...body,
      id,
      publishedAt: body.publishedAt || new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('announcements').doc(id).set(announcement, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'announcements', id), announcement, { merge: true });
      } catch {}
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving announcement' }, { status: 500 });
  }
}
