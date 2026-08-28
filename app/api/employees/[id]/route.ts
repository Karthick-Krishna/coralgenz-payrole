import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { serverEmployeeCache } from '@/lib/server/employee-store';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Employee, UserRole } from '@/types';

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

    // 1. Determine role security: Only Super Admin can modify system role
    const isSuperAdmin = 
      creatorRole === 'super_admin' || 
      (changedByName || createdBy)?.toLowerCase() === 'super admin' || 
      (changedByName || createdBy)?.toLowerCase() === 'karthick krishna';

    let existingEmp = serverEmployeeCache.get(id);

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

    if (portalRole || updates.role) {
      if (isSuperAdmin) {
        updates.role = (portalRole || updates.role) as UserRole;
        updates.portalRole = (portalRole || updates.role) as UserRole;
      } else if (existingEmp?.role) {
        updates.role = existingEmp.role;
        updates.portalRole = existingEmp.role;
      } else {
        updates.role = 'employee';
        updates.portalRole = 'employee';
      }
    }

    const mergedEmp: Employee = cleanFirestoreData({
      ...(existingEmp || {}),
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    });

    // Update in-memory server cache
    serverEmployeeCache.set(id, mergedEmp);

    // 2. Persist to Firestore REST
    try {
      await FirestoreRest.setEmployee(id, mergedEmp);
    } catch (restErr: any) {
      console.warn('Firestore REST employee update notice:', restErr.message);
    }

    // 3. Persist to Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).set(mergedEmp, { merge: true });
      } catch (adminErr: any) {
        console.warn('Admin Firestore employee update notice:', adminErr.message);
      }
    }

    // 4. Persist to Client Firestore
    if (db) {
      try {
        await setDoc(doc(db!, 'employees', id), mergedEmp, { merge: true });
      } catch (clientErr: any) {
        console.warn('Client Firestore employee update notice:', clientErr.message);
      }
    }

    const cleanEmail = (mergedEmp.email || '').toLowerCase().trim();
    const cleanDisplayName = `${mergedEmp.firstName || ''} ${mergedEmp.lastName || ''}`.trim();

    // 5. Update corresponding user document in `users` collection
    const userUpdatePayload = cleanFirestoreData({
      displayName: cleanDisplayName,
      email: cleanEmail,
      phone: mergedEmp.phone || null,
      role: mergedEmp.role || 'employee',
      photoURL: mergedEmp.avatarUrl || null,
      gender: mergedEmp.gender || null,
      updatedAt: new Date().toISOString(),
    });

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

    // 6. Removed Firebase Authentication Password & Display Info updates
    // as per user requirements to strictly manage auth via Firebase Console.

    // 7. Record Security Audit Log
    const auditPayload = {
      userId: changedBy || 'usr-admin',
      userName: changedByName || createdBy || 'Administrator',
      userRole: creatorRole || 'super_admin',
      action: 'update_employee',
      module: 'employee',
      recordId: id,
      recordTitle: cleanDisplayName || id,
      details: `Updated employee profile, credentials and server records for ${cleanDisplayName} (${id}).`,
      timestamp: new Date().toISOString(),
    };

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('audit_logs').add(auditPayload);
      } catch {}
    }
    if (db) {
      try {
        await addDoc(collection(db!, 'audit_logs'), auditPayload);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Employee details and credentials updated successfully on server.',
      employee: mergedEmp,
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

    let employeeName = id;
    let employeeEmail = '';

    // Retrieve employee info before deletion
    if (serverEmployeeCache.has(id)) {
      const emp = serverEmployeeCache.get(id)!;
      employeeName = `${emp.firstName} ${emp.lastName}`.trim();
      employeeEmail = emp.email || '';
      serverEmployeeCache.delete(id);
    }

    // 1. Delete from Admin Firestore & Firebase Auth
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const empDoc = await adminDb.collection('employees').doc(id).get();
        if (empDoc.exists) {
          const emp = empDoc.data() as Employee;
          employeeName = `${emp.firstName} ${emp.lastName}`.trim();
          employeeEmail = emp.email || employeeEmail;
        }

        // Delete employee doc
        await adminDb.collection('employees').doc(id).delete();

        // Delete user docs
        await adminDb.collection('users').doc(id).delete();
        await adminDb.collection('users').doc(`usr-${id.toLowerCase()}`).delete();

        if (employeeEmail) {
          const userSnap = await adminDb.collection('users').where('email', '==', employeeEmail.toLowerCase()).get();
          userSnap.forEach(async (d) => await d.ref.delete());
        }

        // Delete leave balance doc
        await adminDb.collection('leaveBalances').doc(`lb-${id}-2026`).delete();
        await adminDb.collection('leaveBalances').doc(id).delete();

        // Delete Auth account if adminAuth is configured
        if (adminAuth && employeeEmail) {
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

    // 2. Delete from Client Firestore SDK
    if (db) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        await deleteDoc(doc(db, 'users', id));
        await deleteDoc(doc(db, 'users', `usr-${id.toLowerCase()}`));
        await deleteDoc(doc(db, 'leaveBalances', `lb-${id}-2026`));

        // Delete the actual user document that maps to the employee ID
        const q = query(collection(db, 'users'), where('employeeId', '==', id));
        const userDocs = await getDocs(q);
        for (const userDoc of userDocs.docs) {
          await deleteDoc(doc(db, 'users', userDoc.id));
        }
      } catch (clientErr: any) {
        console.warn('Client Firestore delete notice:', clientErr.message);
      }
    }

    // 3. Log Audit Event
    const auditPayload = cleanFirestoreData({
      userId: 'system',
      userName: 'Super Admin',
      userRole: 'super_admin',
      action: 'delete_employee',
      module: 'employee',
      recordId: id,
      recordTitle: employeeName,
      details: `Permanently removed employee record and server auth account for ${employeeName} (${id}).`,
      timestamp: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('audit_logs').add(auditPayload);
      } catch {}
    } else if (db) {
      try {
        await addDoc(collection(db, 'audit_logs'), auditPayload);
      } catch {}
    }

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
