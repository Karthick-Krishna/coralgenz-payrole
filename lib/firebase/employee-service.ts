import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Employee, UserRole } from '@/types';

export interface AddEmployeeOptions {
  portalPassword?: string;
  portalRole?: UserRole;
  createdBy?: string;
}

export class EmployeeService {
  private static collectionName = 'employees';

  /**
   * Fetch all active employees directly via Server API with client Firestore fallback
   */
  public static async getEmployees(): Promise<Employee[]> {
    // 1. Try server API route
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.employees)) {
          return data.employees;
        }
      }
    } catch {
      // Fall through to client Firestore
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName));
        const querySnapshot = await getDocs(q);
        const employees: Employee[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data.status !== 'inactive') {
            employees.push(data);
          }
        });
        return employees.sort((a, b) => b.id.localeCompare(a.id));
      } catch (error: any) {
        console.warn('Client Firestore getEmployees error:', error?.message || error);
      }
    }

    return [];
  }

  /**
   * Get single employee by ID
   */
  public static async getEmployeeById(id: string): Promise<Employee | null> {
    if (!id) return null;

    // 1. Try server API route
    try {
      const res = await fetch(`/api/employees/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.employee) {
          return data.employee;
        }
      }
    } catch {
      // Fall through
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Employee;
        }
      } catch (error: any) {
        console.warn(`Client Firestore getEmployeeById error:`, error?.message || error);
      }
    }

    return null;
  }

  /**
   * Add a new employee profile directly on the Server (bypasses browser permission limits)
   */
  public static async addEmployee(
    empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> | Record<string, any>,
    options?: AddEmployeeOptions
  ): Promise<Employee> {
    const sanitizedEmpData = cleanFirestoreData(empData);

    // 1. First priority: Server API route (runs server-side with zero permission issues)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeData: sanitizedEmpData,
          portalPassword: options?.portalPassword || 'Welcome@2026',
          portalRole: options?.portalRole || 'employee',
          createdBy: options?.createdBy || 'Super Admin',
        }),
      });

      const data = await res.json();

      if (res.ok && data.employee) {
        return data.employee;
      }

      if (!res.ok) {
        console.warn('Server API addEmployee returned error:', data.error);
      }
    } catch (apiErr: any) {
      console.warn('Server API addEmployee exception, attempting direct write:', apiErr.message);
    }

    // 2. Client Firestore fallback with sanitized fields
    if (isFirebaseConfigured && db) {
      try {
        let count = 0;
        try {
          const existingSnapshot = await getDocs(collection(db, this.collectionName));
          count = existingSnapshot.size;
        } catch {
          count = Math.floor(Math.random() * 900) + 10;
        }

        const nextId = `CGG-EMP-${String(count + 1).padStart(4, '0')}`;

        const newEmp: Employee = cleanFirestoreData({
          ...sanitizedEmpData,
          id: nextId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await setDoc(doc(db, this.collectionName, nextId), newEmp);
        return newEmp;
      } catch (clientErr: any) {
        console.error('Client Firestore addEmployee error:', clientErr.message);
        throw new Error(clientErr.message || 'Failed to save employee to Firestore.');
      }
    }

    throw new Error('Could not connect to database server. Please check your internet connection.');
  }

  /**
   * Update an existing employee in Firestore
   */
  public static async updateEmployee(id: string, updates: Partial<Employee> | Record<string, any>): Promise<boolean> {
    if (!id) return false;
    const sanitizedUpdates = cleanFirestoreData(updates);

    // 1. Server API route
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUpdates),
      });
      if (res.ok) return true;
    } catch {
      // Fall through
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString(),
        });
        return true;
      } catch {}
    }

    return true;
  }

  /**
   * Permanently delete an employee from server
   */
  public static async deleteEmployee(id: string): Promise<boolean> {
    if (!id) return false;

    // 1. Server API route
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) return true;
    } catch {
      // Fall through
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, this.collectionName, id));
        return true;
      } catch {}
    }

    return true;
  }
}
