import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { serverEmployeeCache } from '@/lib/server/employee-store';
import { Employee } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').doc(id).get();
        if (snap.exists) {
          const emp = snap.data() as Employee;
          serverEmployeeCache.set(id, emp);
          return NextResponse.json({ success: true, employee: emp });
        }
      } catch {}
    }

    // 2. Try Client Firestore
    if (db) {
      try {
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const emp = docSnap.data() as Employee;
          serverEmployeeCache.set(id, emp);
          return NextResponse.json({ success: true, employee: emp });
        }
      } catch {}
    }

    // 3. Try Cloud Firestore REST
    try {
      const restEmp = await FirestoreRest.getEmployee(id);
      if (restEmp) {
        serverEmployeeCache.set(id, restEmp);
        return NextResponse.json({ success: true, employee: restEmp });
      }
    } catch {}

    // 4. Try Server Cache
    if (serverEmployeeCache.has(id)) {
      return NextResponse.json({ success: true, employee: serverEmployeeCache.get(id) });
    }

    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    if (serverEmployeeCache.has(id)) {
      const existing = serverEmployeeCache.get(id)!;
      const updated = { ...existing, ...updates };
      serverEmployeeCache.set(id, updated);
      try {
        await FirestoreRest.setEmployee(id, updated);
      } catch {}
    }

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).update(updates);
        return NextResponse.json({ success: true, message: 'Employee updated successfully' });
      } catch {}
    }

    // 2. Try Client Firestore
    if (db) {
      try {
        await updateDoc(doc(db, 'employees', id), updates);
        return NextResponse.json({ success: true, message: 'Employee updated successfully' });
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Employee updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = {
      status: 'inactive' as const,
      updatedAt: new Date().toISOString(),
    };

    if (serverEmployeeCache.has(id)) {
      const existing = serverEmployeeCache.get(id)!;
      const updated = { ...existing, ...updates };
      serverEmployeeCache.set(id, updated);
      try {
        await FirestoreRest.setEmployee(id, updated);
      } catch {}
    }

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).update(updates);
        return NextResponse.json({ success: true, message: 'Employee deactivated' });
      } catch {}
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'employees', id), updates);
        return NextResponse.json({ success: true, message: 'Employee deactivated' });
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Employee deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deactivating employee' }, { status: 500 });
  }
}
