import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { EmployeeService } from '@/lib/firebase/employee-service';
import { Employee } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const employee = await EmployeeService.getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const updates = await request.json();
    const cleanUpdates = cleanFirestoreData({
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    });

    let saved = false;

    // 1. Direct Server Admin Firestore Update
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('employees').doc(id).set(cleanUpdates, { merge: true });
        saved = true;

        // Synchronize 'users' collection on server
        try {
          const userSnap = await adminDb.collection('users').where('employeeId', '==', id).get();
          for (const uDoc of userSnap.docs) {
            const userUpdates: Record<string, any> = { updatedAt: new Date().toISOString() };
            if (cleanUpdates.firstName || cleanUpdates.lastName) {
              userUpdates.displayName = `${cleanUpdates.firstName || ''} ${cleanUpdates.lastName || ''}`.trim();
            }
            if (cleanUpdates.email) userUpdates.email = cleanUpdates.email;
            if (cleanUpdates.portalRole || cleanUpdates.role) {
              userUpdates.role = cleanUpdates.portalRole || cleanUpdates.role;
            }
            if (cleanUpdates.departmentName) userUpdates.departmentName = cleanUpdates.departmentName;
            if (cleanUpdates.avatarUrl) userUpdates.avatarUrl = cleanUpdates.avatarUrl;
            await adminDb.collection('users').doc(uDoc.id).set(userUpdates, { merge: true });
          }
        } catch {}

        // Synchronize open payroll items
        try {
          const itemSnap = await adminDb.collection('payrollItems').where('employeeId', '==', id).get();
          for (const iDoc of itemSnap.docs) {
            const itemData = iDoc.data();
            if (itemData.status === 'draft' || itemData.status === 'pending') {
              const itemUpdates: Record<string, any> = {};
              if (cleanUpdates.firstName || cleanUpdates.lastName) {
                itemUpdates.employeeName = `${cleanUpdates.firstName || ''} ${cleanUpdates.lastName || ''}`.trim();
              }
              if (cleanUpdates.panNumber) itemUpdates.panNumber = cleanUpdates.panNumber;
              if (cleanUpdates.bankDetails) {
                itemUpdates.bankName = cleanUpdates.bankDetails.bankName;
                itemUpdates.bankAccountNumber = cleanUpdates.bankDetails.accountNumber;
                itemUpdates.ifscCode = cleanUpdates.bankDetails.ifscCode;
              }
              if (cleanUpdates.departmentName) itemUpdates.departmentName = cleanUpdates.departmentName;
              if (cleanUpdates.designationTitle) itemUpdates.designationTitle = cleanUpdates.designationTitle;
              if (Object.keys(itemUpdates).length > 0) {
                await adminDb.collection('payrollItems').doc(iDoc.id).set(itemUpdates, { merge: true });
              }
            }
          }
        } catch {}
      } catch (adminErr: any) {
        console.warn('Server Admin Firestore update warning:', adminErr.message);
      }
    }

    // 2. Google Cloud Firestore REST API Update
    if (!saved) {
      try {
        const restSaved = await FirestoreRest.setEmployee(id, cleanUpdates as Employee);
        if (restSaved) saved = true;
      } catch (restErr: any) {
        console.warn('Firestore REST setEmployee warning:', restErr.message);
      }
    }

    // 3. Client Firestore Fallback
    if (!saved && db) {
      try {
        const docRef = doc(db, 'employees', id);
        await setDoc(docRef, cleanUpdates, { merge: true });
        saved = true;
      } catch (clientErr: any) {
        console.error('Client Firestore update error:', clientErr.message);
      }
    }

    if (saved) {
      return NextResponse.json({ success: true, employee: cleanUpdates });
    } else {
      return NextResponse.json({ success: false, error: 'Could not write updates to Firestore database server' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error while saving employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const res = await EmployeeService.deleteEmployee(id);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete employee' }, { status: 500 });
  }
}
