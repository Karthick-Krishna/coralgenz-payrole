import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { serverDb } from '@/lib/server/server-db';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Employee, UserRole } from '@/types';

export async function GET() {
  try {
    // 1. Sync from Admin Firestore if available
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').get();
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data && data.id) {
            serverDb.saveEmployee(data);
          }
        });
      } catch (err: any) {
        console.warn('Admin Firestore GET employees notice:', err.message);
      }
    }

    // 2. Sync from Client Firestore if available
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data && data.id) {
            serverDb.saveEmployee(data);
          }
        });
      } catch (err: any) {
        console.warn('Client Firestore GET employees notice:', err.message);
      }
    }

    // 3. Return active employees from persistent server database
    const employees = serverDb.getEmployees();
    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error('API GET /api/employees error:', error);
    const employees = serverDb.getEmployees();
    return NextResponse.json({ success: true, employees });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();
    const {
      employeeData,
      portalPassword = '',
      portalRole = 'employee',
      createdBy = 'Super Admin',
      creatorRole = 'super_admin',
    } = body;

    if (!employeeData || !employeeData.firstName || !employeeData.email) {
      return NextResponse.json(
        { error: 'Missing required employee details: firstName and email are mandatory.' },
        { status: 400 }
      );
    }

    const cleanEmail = employeeData.email.toLowerCase().trim();

    // Strict Hardcoded Roles based on Email
    let effectiveRole: UserRole = 'employee';
    if (cleanEmail === 'karthick@coralgenz.co.in') {
      effectiveRole = 'super_admin';
    } else if (cleanEmail === 'thanvanth@coralgenz.co.in') {
      effectiveRole = 'hr_admin';
    } else if (cleanEmail === 'sharveshwaran.r@coralgenz.co.in') {
      effectiveRole = 'manager';
    }

    // 1. Calculate next sequential Employee ID
    const existingEmployees = serverDb.getAllEmployees();
    const currentCount = existingEmployees.length;
    const nextId = `CGG-EMP-${String(currentCount + 1).padStart(4, '0')}`;

    const newEmp: Employee = cleanFirestoreData({
      ...employeeData,
      id: nextId,
      email: cleanEmail,
      role: effectiveRole,
      portalRole: effectiveRole,
      status: employeeData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Persist to Server Database (Durable Disk Storage)
    const savedEmp = serverDb.saveEmployee(newEmp);

    // 3. Persist to Firestore Layers
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(nextId).set(savedEmp, { merge: true });
      } catch (err: any) {
        console.warn('Admin Firestore set employee notice:', err.message);
      }
    }

    if (db) {
      try {
        await setDoc(doc(db, 'employees', nextId), savedEmp, { merge: true });
      } catch (err: any) {
        console.warn('Client Firestore set employee notice:', err.message);
      }
    }

    // Google Cloud Firestore REST
    try {
      await FirestoreRest.setEmployee(nextId, savedEmp, authHeader);
    } catch {}

    // 4. Save User Profile in Server & Firestore (users collection)
    const uid = `usr-${nextId.toLowerCase()}`;
    const userPayload = cleanFirestoreData({
      id: uid,
      employeeId: nextId,
      email: cleanEmail,
      displayName: `${newEmp.firstName} ${newEmp.lastName}`.trim(),
      role: effectiveRole,
      photoURL: newEmp.avatarUrl || null,
      phone: newEmp.phone || null,
      gender: newEmp.gender || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
    });

    serverDb.saveUser(userPayload);

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('users').doc(uid).set(userPayload, { merge: true });
        await adminDb.collection('users').doc(nextId).set(userPayload, { merge: true });
      } catch {}
    }
    if (db) {
      try {
        await setDoc(doc(db, 'users', uid), userPayload, { merge: true });
        await setDoc(doc(db, 'users', nextId), userPayload, { merge: true });
      } catch {}
    }

    // 5. Initialize Leave Balance in Server
    serverDb.getLeaveBalance(nextId);

    // 6. Security Audit Log
    serverDb.addAuditLog({
      id: `audit-${Date.now()}`,
      organizationId: 'org-coralgenz-01',
      userId: 'usr-admin',
      userName: createdBy || 'Super Admin',
      userRole: (creatorRole as UserRole) || 'super_admin',
      action: 'create_employee',
      module: 'employee',
      recordId: nextId,
      recordTitle: `${newEmp.firstName} ${newEmp.lastName}`,
      details: `Created new employee profile for ${newEmp.firstName} ${newEmp.lastName} (${nextId}) with strict role '${effectiveRole}'.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Employee successfully created and persisted on server.',
      employee: savedEmp,
    });
  } catch (error: any) {
    console.error('API POST /api/employees error:', error);
    return NextResponse.json({ error: error.message || 'Error creating employee' }, { status: 500 });
  }
}
