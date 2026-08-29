import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
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

    let foundEmployee: Employee | null = null;

    // 1. Query Firestore employees collection via Admin SDK if not found
    if (!foundEmployee && adminDb && typeof adminDb.collection === 'function') {
      try {
        if (email) {
          const empSnap = await adminDb.collection('employees').where('email', '==', email).get();
          if (!empSnap.empty) {
            foundEmployee = empSnap.docs[0].data() as Employee;
          }
        }
        if (!foundEmployee && uid) {
          const userDoc = await adminDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const uData = userDoc.data();
            if (uData?.employeeId) {
              const empDoc = await adminDb.collection('employees').doc(uData.employeeId).get();
              if (empDoc.exists) {
                foundEmployee = empDoc.data() as Employee;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('Admin Firestore profile lookup notice:', err.message);
      }
    }

    // 2. Query Client Firestore if not found
    if (!foundEmployee && db && email) {
      try {
        const q = query(collection(db, 'employees'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundEmployee = snap.docs[0].data() as Employee;
        }
      } catch (err: any) {
        console.warn('Client Firestore profile lookup notice:', err.message);
      }
    }

    // If employee record is found
    if (foundEmployee) {
      employeeId = foundEmployee.id;
      displayName = `${foundEmployee.firstName} ${foundEmployee.lastName}`.trim();
      photoURL = foundEmployee.avatarUrl || '';
      departmentName = foundEmployee.departmentName || '';
      designationTitle = foundEmployee.designationTitle || '';

      return NextResponse.json({
        success: true,
        exists: true,
        isEnrolled: true,
        profile: {
          role: foundEmployee.role || role,
          employeeId,
          displayName,
          email: foundEmployee.email || email,
          photoURL,
          departmentName,
          designationTitle,
          status: foundEmployee.status || 'active',
          currentMonthlyGross: foundEmployee.currentMonthlyGross,
          joiningDate: foundEmployee.joiningDate,
          workLocation: foundEmployee.workLocation,
        },
      });
    }

    // Special Founder/Super Admin Bypass if not explicitly in employees collection
    if (email === 'karthick@coralgenz.co.in') {
      return NextResponse.json({
        success: true,
        exists: true,
        isEnrolled: true,
        profile: {
          role: 'super_admin',
          employeeId: 'CGG-EMP-0001',
          displayName: 'Karthick Krishna',
          email,
          photoURL: '/logo.png',
          departmentName: 'Executive Leadership',
          designationTitle: 'Managing Director & Super Admin',
          status: 'active',
        },
      });
    }

    // If no employee profile exists for this email
    return NextResponse.json({
      success: true,
      exists: false,
      isEnrolled: false,
      profile: null,
      message: 'No employee profile found for this email address.',
    });
  } catch (error: any) {
    console.error('GET /api/auth/profile error:', error);
    return NextResponse.json({ error: error.message || 'Error resolving user profile' }, { status: 500 });
  }
}
