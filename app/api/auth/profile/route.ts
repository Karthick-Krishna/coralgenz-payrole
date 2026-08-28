import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { serverEmployeeCache } from '@/lib/server/employee-store';
import { Employee, UserRole } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();
    const uid = searchParams.get('uid') || '';

    if (!email && !uid) {
      return NextResponse.json({ error: 'Email or UID is required' }, { status: 400 });
    }

    let role: UserRole = 'employee';
    let employeeId = '';
    let displayName = email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Employee';
    let photoURL = '';
    let departmentName = '';
    let designationTitle = '';

    // 1. Strict Hardcoded Roles
    if (email === 'karthick@coralgenz.co.in') {
      role = 'super_admin';
    } else if (email === 'thanvanth@coralgenz.co.in') {
      role = 'hr_admin';
    } else if (email === 'sharveshwaran.r@coralgenz.co.in') {
      role = 'manager';
    }

    // 2. Query Firestore users collection via Admin SDK
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        if (uid) {
          const userDoc = await adminDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            role = (data?.role as UserRole) || role;
            employeeId = data?.employeeId || employeeId;
            displayName = data?.displayName || displayName;
            photoURL = data?.photoURL || photoURL;
          }
        }
        if (!employeeId && email) {
          const userSnap = await adminDb.collection('users').where('email', '==', email).get();
          if (!userSnap.empty) {
            const data = userSnap.docs[0].data();
            employeeId = data?.employeeId || employeeId;
            displayName = data?.displayName || displayName;
            photoURL = data?.photoURL || photoURL;
          }
        }
      } catch (err: any) {
        console.warn('Admin Firestore profile lookup notice:', err.message);
      }
    }

    // 3. Query Firestore employees collection via Admin SDK
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        let empSnap;
        if (employeeId) {
          const empDoc = await adminDb.collection('employees').doc(employeeId).get();
          if (empDoc.exists) {
            const emp = empDoc.data() as Employee;
            displayName = `${emp.firstName} ${emp.lastName}`.trim();
            photoURL = emp.avatarUrl || photoURL;
            departmentName = emp.departmentName || '';
            designationTitle = emp.designationTitle || '';
            // role is strict based on email, do not overwrite
          }
        } else if (email) {
          empSnap = await adminDb.collection('employees').where('email', '==', email).get();
          if (!empSnap.empty) {
            const emp = empSnap.docs[0].data() as Employee;
            employeeId = emp.id;
            displayName = `${emp.firstName} ${emp.lastName}`.trim();
            photoURL = emp.avatarUrl || photoURL;
            departmentName = emp.departmentName || '';
            designationTitle = emp.designationTitle || '';
            // role is strict based on email, do not overwrite
          }
        }
      } catch {}
    }

    // 4. Client SDK / Server Cache Fallback
    if (!employeeId && email) {
      for (const [id, emp] of serverEmployeeCache.entries()) {
        if (emp.email?.toLowerCase() === email) {
          employeeId = emp.id;
          displayName = `${emp.firstName} ${emp.lastName}`.trim();
          photoURL = emp.avatarUrl || photoURL;
          departmentName = emp.departmentName || '';
          designationTitle = emp.designationTitle || '';
          // role is strict based on email, do not overwrite
          break;
        }
      }
    }

    // 5. Removed fallback designation-based role derivation. Role is strict.

    return NextResponse.json({
      success: true,
      profile: {
        role,
        employeeId: employeeId || 'CGG-EMP-0001',
        displayName,
        email,
        photoURL,
        departmentName,
        designationTitle,
      },
    });
  } catch (error: any) {
    console.error('GET /api/auth/profile error:', error);
    return NextResponse.json({ error: error.message || 'Error resolving user profile' }, { status: 500 });
  }
}
