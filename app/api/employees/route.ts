import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { db, firebaseConfig } from '@/lib/firebase/config';
import { collection, doc, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { serverEmployeeCache } from '@/lib/server/employee-store';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { Employee, UserRole } from '@/types';

export async function GET() {
  try {
    const employees: Employee[] = [];

    // 1. Try Admin Firestore
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const snap = await adminDb.collection('employees').get();
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data.status !== 'inactive') {
            employees.push(data);
          }
        });
        if (employees.length > 0) {
          employees.forEach((e) => serverEmployeeCache.set(e.id, e));
          return NextResponse.json({ success: true, employees });
        }
      } catch (err: any) {
        console.warn('Admin Firestore GET employees notice:', err.message);
      }
    }

    // 2. Try Server Client Firestore
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data.status !== 'inactive') {
            employees.push(data);
          }
        });
        if (employees.length > 0) {
          employees.forEach((e) => serverEmployeeCache.set(e.id, e));
          return NextResponse.json({ success: true, employees });
        }
      } catch (err: any) {
        console.warn('Client Firestore GET employees notice:', err.message);
      }
    }

    // 3. Try Google Cloud Firestore REST API (Vercel Serverless)
    try {
      const restEmployees = await FirestoreRest.getEmployees();
      if (restEmployees && restEmployees.length > 0) {
        const active = restEmployees.filter((e) => e.status !== 'inactive');
        active.forEach((e) => serverEmployeeCache.set(e.id, e));
        return NextResponse.json({ success: true, employees: active });
      }
    } catch {}

    // 4. Fallback to server memory cache
    const cached = Array.from(serverEmployeeCache.values()).filter((e) => e.status !== 'inactive');
    return NextResponse.json({ success: true, employees: cached });
  } catch (error: any) {
    console.error('API GET /api/employees error:', error);
    const cached = Array.from(serverEmployeeCache.values()).filter((e) => e.status !== 'inactive');
    return NextResponse.json({ success: true, employees: cached });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeData,
      portalPassword = 'Welcome@2026',
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
    let currentCount = serverEmployeeCache.size;
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        const countSnap = await adminDb.collection('employees').get();
        currentCount = Math.max(currentCount, countSnap.size);
      } catch {}
    } else if (db) {
      try {
        const snap = await getDocs(collection(db, 'employees'));
        currentCount = Math.max(currentCount, snap.size);
      } catch {}
    }

    const nextId = `CGG-EMP-${String(currentCount + 1).padStart(4, '0')}`;

    const newEmp: Employee = cleanFirestoreData({
      ...employeeData,
      id: nextId,
      email: cleanEmail,
      role: effectiveRole,
      portalRole: effectiveRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Store in shared cache
    serverEmployeeCache.set(nextId, newEmp);

    // 2. Save Employee Document across all Firestore layers
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(nextId).set(newEmp, { merge: true });
      } catch (err: any) {
        console.warn('Admin Firestore set employee warning:', err.message);
      }
    }

    if (db) {
      try {
        await setDoc(doc(db, 'employees', nextId), newEmp, { merge: true });
      } catch (err: any) {
        console.warn('Client Firestore set employee warning:', err.message);
      }
    }

    // Google Cloud Firestore REST API
    try {
      await FirestoreRest.setEmployee(nextId, newEmp);
    } catch {}

    // Firebase Auth Identity Provisioning removed as per user requirements.
    // Super admin will explicitly create Firebase Auth credentials via Firebase Console.
    const uid = `usr-${nextId.toLowerCase()}`;

    // 4. Save User Profile in Firestore (users collection)
    const userPayload = cleanFirestoreData({
      id: uid,
      employeeId: nextId,
      email: cleanEmail,
      displayName: `${newEmp.firstName} ${newEmp.lastName}`,
      role: effectiveRole,
      photoURL: newEmp.avatarUrl || null,
      phone: newEmp.phone || null,
      gender: newEmp.gender || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
    });

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

    // 5. Save Default Leave Balance in Firestore
    const leaveBalPayload = cleanFirestoreData({
      id: `lb-${nextId}-2026`,
      organizationId: 'org-coralgenz-01',
      employeeId: nextId,
      year: 2026,
      casual: { allocated: 12, used: 0, remaining: 12 },
      sick: { allocated: 10, used: 0, remaining: 10 },
      annual: { allocated: 15, used: 0, remaining: 15 },
      earned: { allocated: 10, used: 0, remaining: 10 },
      unpaid: { used: 0 },
      updatedAt: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('leaveBalances').doc(leaveBalPayload.id).set(leaveBalPayload, { merge: true });
      } catch {}
    }
    if (db) {
      try {
        await setDoc(doc(db, 'leaveBalances', leaveBalPayload.id), leaveBalPayload, { merge: true });
      } catch {}
    }

    // 6. Record Audit Log in Firestore
    const auditPayload = cleanFirestoreData({
      userId: 'system',
      userName: createdBy,
      userRole: 'super_admin',
      action: 'create_employee',
      module: 'employee',
      recordId: nextId,
      recordTitle: `${newEmp.firstName} ${newEmp.lastName}`,
      details: `Created new employee profile and provisioned server login credentials for ${cleanEmail} (${newEmp.designationTitle})`,
      timestamp: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('audit_logs').add(auditPayload);
      } catch {}
    }
    if (db) {
      try {
        await addDoc(collection(db, 'audit_logs'), auditPayload);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      employee: newEmp,
      user: {
        uid,
        email: cleanEmail,
        role: portalRole,
      },
      message: `Employee ${newEmp.firstName} ${newEmp.lastName} (${nextId}) and login credentials saved directly to server!`,
    });
  } catch (error: any) {
    console.error('API POST /api/employees error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save employee on server' },
      { status: 500 }
    );
  }
}
