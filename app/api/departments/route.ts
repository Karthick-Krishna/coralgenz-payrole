import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Department } from '@/types';

export async function GET() {
  try {
    const departments = serverDb.getDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    return NextResponse.json({ success: true, departments: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'Department name and code are required' }, { status: 400 });
    }

    const saved = serverDb.saveDepartment(body);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('departments').doc(saved.id).set(cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'departments', saved.id), cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: body.userId || 'usr-admin',
      userName: body.userName || 'Super Admin',
      userRole: 'super_admin',
      action: 'update_department',
      module: 'department',
      recordId: saved.id,
      recordTitle: saved.name,
      details: `Saved department ${saved.name} (${saved.code}) on server.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, department: saved });
  } catch (error: any) {
    console.error('POST /api/departments error:', error);
    return NextResponse.json({ error: error.message || 'Error saving department' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    serverDb.deleteDepartment(id);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('departments').doc(id).delete();
      } catch {}
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'departments', id));
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Department removed from server' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting department' }, { status: 500 });
  }
}
