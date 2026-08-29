import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Designation } from '@/types';

export async function GET() {
  try {
    const designations = serverDb.getDesignations();
    return NextResponse.json({ success: true, designations });
  } catch (error: any) {
    return NextResponse.json({ success: true, designations: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Designation title is required' }, { status: 400 });
    }

    const saved = serverDb.saveDesignation(body);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('designations').doc(saved.id).set(cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'designations', saved.id), cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: body.userId || 'usr-admin',
      userName: body.userName || 'Super Admin',
      userRole: 'super_admin',
      action: 'update_designation',
      module: 'designation',
      recordId: saved.id,
      recordTitle: saved.title,
      details: `Saved designation ${saved.title} on server.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, designation: saved });
  } catch (error: any) {
    console.error('POST /api/designations error:', error);
    return NextResponse.json({ error: error.message || 'Error saving designation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Designation ID is required' }, { status: 400 });
    }

    serverDb.deleteDesignation(id);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('designations').doc(id).delete();
      } catch {}
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'designations', id));
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Designation removed from server' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting designation' }, { status: 500 });
  }
}
