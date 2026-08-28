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

    // 1. Super Admin special handling
    if (email === 'karthick@coralgenz.co.in' || email === 'admin@coralgenz.co.in') {
      return NextResponse.json({
        success: true,
        profile: {
          role: 'super_admin' as UserRole,
          employeeId: 'CGG-EMP-0001',
          displayName: 'Karthick Krishna',
          email,
          photoURL: '/logo.png',
          departmentName: 'Executive Leadership',
          designationTitle: 'Managing Director & Super Admin',
        },
      });
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
            role = (data?.role as UserRole) || role;
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
            if (emp.role) role = emp.role as UserRole;
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
            if (emp.role) role = emp.role as UserRole;
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
          if (emp.role) role = emp.role as UserRole;
          break;
        }
      }
    }

    // 5. Fallback designation-based role derivation if role was still default "employee"
    if (role === 'employee' && designationTitle) {
      const dt = designationTitle.toLowerCase();
      const dn = departmentName.toLowerCase();
      if (dt.includes('super admin') || dt.includes('director') || dt.includes('founder')) {
        role = 'super_admin';
      } else if (dt.includes('hr') || dt.includes('human resource') || dn.includes('human resource') || dn.includes('talent')) {
        role = 'hr_admin';
      } else if (dt.includes('payroll') || dt.includes('finance') || dt.includes('accountant') || dn.includes('finance') || dn.includes('payroll')) {
        role = 'payroll_manager';
      } else if (dt.includes('manager') || dt.includes('lead') || dt.includes('head') || dt.includes('supervisor')) {
        role = 'manager';
      }
    }

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
