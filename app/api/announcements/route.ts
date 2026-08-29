import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Announcement } from '@/types';

export async function GET() {
  try {
    const announcements = serverDb.getAnnouncements();
    return NextResponse.json({ success: true, announcements });
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

    // 1. Save to persistent Server Database
    const saved = serverDb.saveAnnouncement(announcement);

    // 2. Mirror to Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('announcements').doc(id).set(saved, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'announcements', id), saved, { merge: true });
      } catch {}
    }

    // 3. Auto-generate notification for all users
    serverDb.addNotification({
      title: `Announcement: ${saved.title}`,
      message: saved.content.slice(0, 100),
      type: 'announcement',
      link: '/announcements',
    });

    return NextResponse.json({ success: true, announcement: saved });
  } catch (error: any) {
    console.error('POST /api/announcements error:', error);
    return NextResponse.json({ error: error.message || 'Error saving announcement' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    serverDb.deleteAnnouncement(id);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('announcements').doc(id).delete();
      } catch {}
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting announcement' }, { status: 500 });
  }
}
