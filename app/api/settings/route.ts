import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Organization } from '@/types';

export async function GET() {
  try {
    const organization = serverDb.getOrganization();
    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching organization settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = serverDb.saveOrganization(body);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('organizations').doc(saved.id).set(cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'organizations', saved.id), cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: saved.id || 'org-coralgenz-01',
      userId: body.userId || 'usr-superadmin-01',
      userName: body.userName || 'Super Admin',
      userRole: 'super_admin',
      action: 'update_settings',
      module: 'settings',
      recordId: saved.id,
      recordTitle: saved.name,
      details: `Updated corporate settings and statutory parameters for ${saved.name}.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, organization: saved });
  } catch (error: any) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: error.message || 'Error saving organization settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
