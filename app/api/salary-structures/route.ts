import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { SalaryStructure } from '@/types';

export async function GET() {
  try {
    const salaryStructure = serverDb.getSalaryStructure();
    return NextResponse.json({ success: true, salaryStructure });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching salary structure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = serverDb.saveSalaryStructure(body);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('salary_structures').doc(saved.id).set(cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    if (db) {
      try {
        await setDoc(doc(db, 'salary_structures', saved.id), cleanFirestoreData(saved), { merge: true });
      } catch {}
    }

    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: saved.organizationId || 'org-coralgenz-01',
      userId: body.userId || 'usr-superadmin-01',
      userName: body.userName || 'Super Admin',
      userRole: 'super_admin',
      action: 'update_salary_structure',
      module: 'payroll',
      recordId: saved.id,
      recordTitle: saved.name,
      details: `Updated salary calculation rules and allowances structure for ${saved.name}.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, salaryStructure: saved });
  } catch (error: any) {
    console.error('POST /api/salary-structures error:', error);
    return NextResponse.json({ error: error.message || 'Error saving salary structure' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
