import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Employee, UserRole } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Try persistent Server Database
    const serverEmp = serverDb.getEmployeeById(id);
    if (serverEmp) {
      return NextResponse.json({ success: true, employee: serverEmp });
    }

    // 2. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').doc(id).get();
        if (snap.exists) {
          const emp = snap.data() as Employee;
          serverDb.saveEmployee(emp);
          return NextResponse.json({ success: true, employee: emp });
        }
      } catch {}
    }

    // 3. Try Client Firestore
    if (db) {
      try {
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const emp = docSnap.data() as Employee;
          serverDb.saveEmployee(emp);
          return NextResponse.json({ success: true, employee: emp });
        }
      } catch {}
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
    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();
    const {
      portalPassword,
      portalRole,
      creatorRole = 'employee',
      createdBy = 'Admin',
      changedByName,
      changedBy,
      ...rawUpdates
    } = body;

    const updates = cleanFirestoreData({
      ...rawUpdates,
      updatedAt: new Date().toISOString(),
    });

    // 1. Fetch existing employee from server database or Firestore
    let existingEmp = serverDb.getEmployeeById(id);

    if (!existingEmp) {
      if (adminDb && typeof adminDb.collection === 'function') {
        try {
          const snap = await adminDb.collection('employees').doc(id).get();
          if (snap.exists) existingEmp = snap.data() as Employee;
        } catch {}
      }
      if (!existingEmp && db) {
        try {
          const docSnap = await getDoc(doc(db, 'employees', id));
          if (docSnap.exists()) existingEmp = docSnap.data() as Employee;
        } catch {}
      }
    }

    const mergedEmp: Employee = cleanFirestoreData({
      ...(existingEmp || {}),
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    });

    // Enforce strict roles based on email
    const cleanEmail = (mergedEmp.email || '').toLowerCase().trim();
    if (cleanEmail === 'karthick@coralgenz.co.in') {
      mergedEmp.role = 'super_admin';
    } else if (cleanEmail === 'thanvanth@coralgenz.co.in') {
      mergedEmp.role = 'hr_admin';
    } else if (cleanEmail === 'sharveshwaran.r@coralgenz.co.in') {
      mergedEmp.role = 'manager';
    } else if (!mergedEmp.role) {
      mergedEmp.role = 'employee';
    }
    mergedEmp.portalRole = mergedEmp.role;

    // 2. Persist to Server Database (Durable Disk Storage)
    const savedEmp = serverDb.saveEmployee(mergedEmp);

    // 3. Persist to Google Cloud Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).set(savedEmp, { merge: true });
      } catch (adminErr: any) {
        console.warn('Admin Firestore employee update notice:', adminErr.message);
      }
    }

    if (db) {
      try {
        await setDoc(doc(db!, 'employees', id), savedEmp, { merge: true });
      } catch (clientErr: any) {
        console.warn('Client Firestore employee update notice:', clientErr.message);
      }
    }

    try {
      await FirestoreRest.setEmployee(id, savedEmp, authHeader);
    } catch {}

    const cleanDisplayName = `${savedEmp.firstName || ''} ${savedEmp.lastName || ''}`.trim();

    // 4. Update corresponding user document in `users` collection
    const userUpdatePayload = cleanFirestoreData({
      displayName: cleanDisplayName,
      email: cleanEmail,
      phone: savedEmp.phone || null,
      role: savedEmp.role || 'employee',
      photoURL: savedEmp.avatarUrl || null,
      gender: savedEmp.gender || null,
      status: savedEmp.status || 'active',
      updatedAt: new Date().toISOString(),
    });

    const userDoc = serverDb.getUser(id) || serverDb.getUser(`usr-${id.toLowerCase()}`);
    if (userDoc) {
      serverDb.saveUser({ ...userDoc, ...userUpdatePayload });
    }

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('users').where('employeeId', '==', id).get();
        snap.forEach(async (docSnap) => {
          await docSnap.ref.set(userUpdatePayload, { merge: true });
        });
        await adminDb.collection('users').doc(`usr-${id.toLowerCase()}`).set(userUpdatePayload, { merge: true });
      } catch {}
    }

    if (db) {
      try {
        const q = query(collection(db!, 'users'), where('employeeId', '==', id));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await setDoc(doc(db!, 'users', d.id), userUpdatePayload, { merge: true });
        });
      } catch {}
    }

    // 5. Record Security Audit Log
    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: changedBy || 'usr-admin',
      userName: changedByName || createdBy || 'Administrator',
      userRole: (creatorRole as UserRole) || 'super_admin',
      action: 'update_employee',
      module: 'employee',
      recordId: id,
      recordTitle: cleanDisplayName || id,
      details: `Updated employee profile and server records for ${cleanDisplayName} (${id}).`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Employee details updated successfully on server.',
      employee: savedEmp,
    });
  } catch (error: any) {
    console.error('PUT /api/employees/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Error updating employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingEmp = serverDb.getEmployeeById(id);
    const employeeName = existingEmp ? `${existingEmp.firstName} ${existingEmp.lastName}`.trim() : id;
    const employeeEmail = existingEmp?.email || '';

    // 1. Delete from Server Database
    serverDb.deleteEmployee(id);

    // 2. Delete from Admin Firestore & Firebase Auth
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).delete();
        await adminDb.collection('users').doc(id).delete();
        await adminDb.collection('users').doc(`usr-${id.toLowerCase()}`).delete();
        await adminDb.collection('leaveBalances').doc(`lb-${id}-2026`).delete();

        if (employeeEmail && adminAuth) {
          try {
            const authUser = await adminAuth.getUserByEmail(employeeEmail.toLowerCase());
            if (authUser) {
              await adminAuth.deleteUser(authUser.uid);
            }
          } catch {}
        }
      } catch (adminErr: any) {
        console.warn('Admin Firestore delete notice:', adminErr.message);
      }
    }

    // 3. Delete from Client Firestore SDK
    if (db) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        await deleteDoc(doc(db, 'users', id));
        await deleteDoc(doc(db, 'users', `usr-${id.toLowerCase()}`));
        await deleteDoc(doc(db, 'leaveBalances', `lb-${id}-2026`));

        const q = query(collection(db, 'users'), where('employeeId', '==', id));
        const userDocs = await getDocs(q);
        for (const userDoc of userDocs.docs) {
          await deleteDoc(doc(db, 'users', userDoc.id));
        }
      } catch (clientErr: any) {
        console.warn('Client Firestore delete notice:', clientErr.message);
      }
    }

    // 4. Log Audit Event
    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: 'system',
      userName: 'Super Admin',
      userRole: 'super_admin',
      action: 'delete_employee',
      module: 'employee',
      recordId: id,
      recordTitle: employeeName,
      details: `Permanently removed employee record and server data for ${employeeName} (${id}).`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${employeeName} (${id}) has been permanently deleted from the server.`,
    });
  } catch (error: any) {
    console.error('API DELETE /api/employees/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee from server' },
      { status: 500 }
    );
  }
}
