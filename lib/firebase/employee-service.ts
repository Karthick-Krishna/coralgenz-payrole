import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { FirestoreRest } from './firestore-rest';
import { AuditService } from './audit-service';
import { Employee, UserRole } from '@/types';

export interface AddEmployeeOptions {
  portalPassword?: string;
  portalRole?: UserRole;
  createdBy?: string;
  creatorRole?: string;
}

export class EmployeeService {
  private static collectionName = 'employees';

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {}
    return headers;
  }

  /**
   * Fetch all active employees directly from Google Cloud Firestore
   */
  public static async getEmployees(): Promise<Employee[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName));
        const querySnapshot = await getDocs(q);
        const employees: Employee[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data && data.status !== 'inactive') {
            employees.push({ ...data, id: docSnap.id });
          }
        });
        
        if (employees.length > 0) {
          return employees.sort((a, b) => b.id.localeCompare(a.id));
        }
      } catch (error: any) {
        console.warn('Firestore getEmployees notice:', error?.message || error);
      }
    }

    try {
      const restEmps = await FirestoreRest.getEmployees();
      return restEmps.filter((e) => e.status !== 'inactive');
    } catch {
      return [];
    }
  }

  /**
   * Get single employee by ID from Firestore
   */
  public static async getEmployeeById(id: string): Promise<Employee | null> {
    if (!id) return null;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { ...docSnap.data(), id: docSnap.id } as Employee;
        }
      } catch (error: any) {
        console.warn(`Firestore getEmployeeById notice:`, error?.message || error);
      }
    }

    try {
      const restEmp = await FirestoreRest.getEmployee(id);
      if (restEmp) return restEmp;
    } catch {}

    return null;
  }

  /**
   * Add a new employee profile to Firestore with email uniqueness check and Auth account linking
   */
  public static async addEmployee(
    empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> | Record<string, any>,
    options?: AddEmployeeOptions
  ): Promise<Employee> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const sanitizedEmpData = cleanFirestoreData(empData);

    try {
      // 1. Email Uniqueness Validation
      if (sanitizedEmpData.email) {
        const cleanEmail = sanitizedEmpData.email.toLowerCase().trim();
        const emailQuery = query(
          collection(db, this.collectionName),
          where('email', '==', cleanEmail)
        );
        const existingSnapshot = await getDocs(emailQuery);
        if (!existingSnapshot.empty) {
          throw new Error(`An employee with email "${cleanEmail}" already exists on the server.`);
        }
      }

      // 2. Generate new Document ID
      let count = 0;
      try {
        const existingSnapshot = await getDocs(collection(db, this.collectionName));
        count = existingSnapshot.size;
      } catch {
        count = Math.floor(Math.random() * 900) + 10;
      }
      const nextId = `CGG-EMP-${String(count + 1).padStart(4, '0')}`;

      // 3. Provision or Link Firebase Auth account
      let authUid = sanitizedEmpData.userId || sanitizedEmpData.uid || '';
      try {
        const provRes = await fetch('/api/auth/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sanitizedEmpData.email,
            password: options?.portalPassword || 'Welcome@2026',
            displayName: `${sanitizedEmpData.firstName || ''} ${sanitizedEmpData.lastName || ''}`.trim(),
            role: options?.portalRole || sanitizedEmpData.role || 'employee',
            employeeId: nextId,
            phone: sanitizedEmpData.phone,
            createdBy: options?.createdBy || 'Super Admin',
          }),
        });
        const provData = await provRes.json();
        if (provData?.user?.id || provData?.user?.uid) {
          authUid = provData.user.id || provData.user.uid;
        }
      } catch (provErr) {
        console.warn('Auth provision warning on addEmployee:', provErr);
      }

      const newEmp: Employee = cleanFirestoreData({
        ...sanitizedEmpData,
        id: nextId,
        uid: authUid || nextId,
        userId: authUid || nextId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 4. Save to Firestore
      await setDoc(doc(db, this.collectionName, nextId), newEmp);

      // 5. Audit Log
      try {
        await AuditService.logAction({
          action: 'EMPLOYEE_CREATED',
          module: 'employees',
          details: `Created new employee profile ${newEmp.firstName} ${newEmp.lastName} (${newEmp.id}, ${newEmp.email}) with ${newEmp.portalRole || newEmp.role || 'employee'} access`,
          userId: options?.createdBy || 'usr-superadmin-01',
          userName: options?.createdBy || 'Super Admin',
          userRole: options?.creatorRole || 'super_admin',
          recordId: nextId,
          recordTitle: `${newEmp.firstName} ${newEmp.lastName}`,
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { employee: newEmp } }));
      }

      return newEmp;
    } catch (err: any) {
      console.error('Firestore addEmployee error:', err.message);
      throw new Error(err.message || 'Failed to save employee to Firestore.');
    }
  }

  /**
   * Deactivate an employee (Normal HR operation: preserves historical records while disabling access)
   */
  public static async deactivateEmployee(
    id: string,
    adminUser: { id: string; name: string; role?: string }
  ): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      const emp = snap.data() as Employee;

      await updateDoc(docRef, {
        status: 'inactive',
        updatedAt: new Date().toISOString(),
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: adminUser.id,
      });

      await AuditService.logAction({
        action: 'EMPLOYEE_DEACTIVATED',
        module: 'employees',
        details: `Deactivated employee ${emp.firstName} ${emp.lastName} (${id}). Historical payroll and attendance preserved.`,
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role || 'admin',
        recordId: id,
        recordTitle: `Employee ${id}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { deactivatedId: id } }));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore deactivateEmployee error:', err.message);
      return false;
    }
  }

  /**
   * Update an existing employee in Firestore with full server persistence & synced caches
   */
  public static async updateEmployee(
    id: string,
    updates: Partial<Employee> | Record<string, any>
  ): Promise<boolean> {
    if (!id) return false;

    const sanitizedUpdates = cleanFirestoreData(updates);
    let serverSuccess = false;

    // 1. Primary: Server API Update (/api/employees/[id])
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUpdates),
      });
      if (res.ok) {
        serverSuccess = true;
      }
    } catch (apiErr) {
      console.warn('API updateEmployee notice:', apiErr);
    }

    // 2. Direct Firestore SDK update (ensures immediate local client cache consistency)
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const updatePayload = {
          ...sanitizedUpdates,
          id,
          updatedAt: new Date().toISOString(),
        };

        // Atomically save updates to Firestore with merge
        await setDoc(docRef, updatePayload, { merge: true });
        serverSuccess = true;

        // Synchronize user profile in 'users' collection if names, email, role, or avatar changed
        try {
          const userQuery = query(collection(db, 'users'), where('employeeId', '==', id));
          const userSnap = await getDocs(userQuery);
          for (const uDoc of userSnap.docs) {
            const userUpdates: Record<string, any> = { updatedAt: new Date().toISOString() };
            if (sanitizedUpdates.firstName || sanitizedUpdates.lastName) {
              userUpdates.displayName = `${sanitizedUpdates.firstName || ''} ${sanitizedUpdates.lastName || ''}`.trim();
            }
            if (sanitizedUpdates.email) userUpdates.email = sanitizedUpdates.email;
            if (sanitizedUpdates.portalRole || sanitizedUpdates.role) {
              userUpdates.role = sanitizedUpdates.portalRole || sanitizedUpdates.role;
            }
            if (sanitizedUpdates.departmentName) userUpdates.departmentName = sanitizedUpdates.departmentName;
            if (sanitizedUpdates.avatarUrl) userUpdates.avatarUrl = sanitizedUpdates.avatarUrl;
            await setDoc(doc(db, 'users', uDoc.id), cleanFirestoreData(userUpdates), { merge: true });
          }
        } catch (userSyncErr) {
          console.warn('User doc sync warning:', userSyncErr);
        }

        // Synchronize open/draft payroll items with updated employee details
        try {
          const itemQuery = query(collection(db, 'payrollItems'), where('employeeId', '==', id));
          const itemSnap = await getDocs(itemQuery);
          for (const iDoc of itemSnap.docs) {
            const itemData = iDoc.data();
            if (itemData.status === 'draft' || itemData.status === 'pending') {
              const itemUpdates: Record<string, any> = {};
              if (sanitizedUpdates.firstName || sanitizedUpdates.lastName) {
                itemUpdates.employeeName = `${sanitizedUpdates.firstName || ''} ${sanitizedUpdates.lastName || ''}`.trim();
              }
              if (sanitizedUpdates.panNumber) itemUpdates.panNumber = sanitizedUpdates.panNumber;
              if (sanitizedUpdates.bankDetails) {
                itemUpdates.bankName = sanitizedUpdates.bankDetails.bankName;
                itemUpdates.bankAccountNumber = sanitizedUpdates.bankDetails.accountNumber;
                itemUpdates.ifscCode = sanitizedUpdates.bankDetails.ifscCode;
              }
              if (sanitizedUpdates.departmentName) itemUpdates.departmentName = sanitizedUpdates.departmentName;
              if (sanitizedUpdates.designationTitle) itemUpdates.designationTitle = sanitizedUpdates.designationTitle;
              if (Object.keys(itemUpdates).length > 0) {
                await setDoc(doc(db, 'payrollItems', iDoc.id), cleanFirestoreData(itemUpdates), { merge: true });
              }
            }
          }
        } catch (itemSyncErr) {
          console.warn('Payroll item sync warning:', itemSyncErr);
        }
      } catch (err: any) {
        console.error('Firestore updateEmployee error:', err.message);
      }
    }

    if (serverSuccess) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('coralgenz_store_updated', {
            detail: { id, updates: sanitizedUpdates },
          })
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Permanently delete an employee and cascade-delete all related payroll items,
   * payslips, attendance records, leave balances, requests, and credentials from the server.
   */
  public static async deleteEmployee(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      // 1. Delete Employee document from 'employees' collection
      await deleteDoc(doc(db, this.collectionName, id));

      // 2. Cascade delete all Payslips for this employee
      try {
        const payslipsQuery = query(collection(db, 'payslips'), where('employeeId', '==', id));
        const payslipsSnap = await getDocs(payslipsQuery);
        for (const pDoc of payslipsSnap.docs) {
          await deleteDoc(doc(db, 'payslips', pDoc.id));
        }
      } catch (pErr) {
        console.warn('Cascade delete payslips warning:', pErr);
      }

      // 3. Cascade delete all Payroll Items for this employee
      const affectedRunIds = new Set<string>();
      try {
        const itemsQuery = query(collection(db, 'payrollItems'), where('employeeId', '==', id));
        const itemsSnap = await getDocs(itemsQuery);
        for (const iDoc of itemsSnap.docs) {
          const itemData = iDoc.data();
          if (itemData.payrollRunId) affectedRunIds.add(itemData.payrollRunId);
          if (itemData.runId) affectedRunIds.add(itemData.runId);
          await deleteDoc(doc(db, 'payrollItems', iDoc.id));
        }
      } catch (iErr) {
        console.warn('Cascade delete payrollItems warning:', iErr);
      }

      // 4. Update or clean up affected Payroll Runs
      for (const runId of Array.from(affectedRunIds)) {
        try {
          const remainingItemsQuery = query(collection(db, 'payrollItems'), where('payrollRunId', '==', runId));
          const remainingItemsSnap = await getDocs(remainingItemsQuery);
          
          if (remainingItemsSnap.empty) {
            // No more employees in this run -> delete the empty run
            await deleteDoc(doc(db, 'payrollRuns', runId));
          } else {
            // Recalculate run totals without the deleted employee
            let totalGross = 0;
            let totalNet = 0;
            let totalDeductions = 0;
            remainingItemsSnap.forEach((d) => {
              const dData = d.data();
              totalGross += Number(dData.grossSalary) || 0;
              totalNet += Number(dData.netSalary) || 0;
              totalDeductions += Number(dData.totalDeductions) || 0;
            });
            await setDoc(
              doc(db, 'payrollRuns', runId),
              {
                totalEmployees: remainingItemsSnap.size,
                totalGrossPayroll: totalGross,
                totalDeductions: totalDeductions,
                totalNetPayroll: totalNet,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } catch (rErr) {
          console.warn(`Payroll run recalculation warning for ${runId}:`, rErr);
        }
      }

      // 5. Cascade delete all Attendance records for this employee
      try {
        const attendanceQuery = query(collection(db, 'attendance'), where('employeeId', '==', id));
        const attendanceSnap = await getDocs(attendanceQuery);
        for (const aDoc of attendanceSnap.docs) {
          await deleteDoc(doc(db, 'attendance', aDoc.id));
        }
      } catch (aErr) {
        console.warn('Cascade delete attendance warning:', aErr);
      }

      // 6. Cascade delete all Leave Requests & Leave Balances
      try {
        const leaveQuery = query(collection(db, 'leaveRequests'), where('employeeId', '==', id));
        const leaveSnap = await getDocs(leaveQuery);
        for (const lDoc of leaveSnap.docs) {
          await deleteDoc(doc(db, 'leaveRequests', lDoc.id));
        }
        try {
          await deleteDoc(doc(db, 'leaveBalances', id));
          await deleteDoc(doc(db, 'leaveBalances', `lb-${id}`));
        } catch {}
      } catch (lErr) {
        console.warn('Cascade delete leaves warning:', lErr);
      }

      // 7. Cascade delete all General Requests
      try {
        const reqQuery = query(collection(db, 'requests'), where('employeeId', '==', id));
        const reqSnap = await getDocs(reqQuery);
        for (const rDoc of reqSnap.docs) {
          await deleteDoc(doc(db, 'requests', rDoc.id));
        }
      } catch (rErr) {
        console.warn('Cascade delete requests warning:', rErr);
      }

      // 8. Cascade delete Notifications
      try {
        const notifQuery = query(collection(db, 'notifications'), where('userId', '==', id));
        const notifSnap = await getDocs(notifQuery);
        for (const nDoc of notifSnap.docs) {
          await deleteDoc(doc(db, 'notifications', nDoc.id));
        }
      } catch (nErr) {
        console.warn('Cascade delete notifications warning:', nErr);
      }

      // 9. Cascade delete User login mapping
      try {
        const userQuery = query(collection(db, 'users'), where('employeeId', '==', id));
        const userSnap = await getDocs(userQuery);
        for (const uDoc of userSnap.docs) {
          await deleteDoc(doc(db, 'users', uDoc.id));
        }
      } catch (uErr) {
        console.warn('Cascade delete user doc warning:', uErr);
      }

      // 10. Audit Trail
      try {
        await AuditService.logAction({
          action: 'EMPLOYEE_DELETED',
          module: 'employees',
          details: `Cascaded permanent deletion for employee ${id} and all related payslips, payroll items, attendance, leaves, and records.`,
          userId: 'usr-superadmin-01',
          userName: 'Super Admin',
          userRole: 'super_admin',
          recordId: id,
          recordTitle: `Employee ${id}`,
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { deletedId: id } }));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore deleteEmployee error:', err.message);
      return false;
    }
  }
}
