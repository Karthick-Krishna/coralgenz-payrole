import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
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
   * Fetch all active employees directly from the Server API with live client sync
   */
  public static async getEmployees(): Promise<Employee[]> {
    // 1. Try server API route
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/employees', { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.employees)) {
          return data.employees;
        }
      }
    } catch (err) {
      console.warn('Server API getEmployees notice:', err);
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName));
        const querySnapshot = await getDocs(q);
        const employees: Employee[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Employee;
          if (data && data.status !== 'inactive') {
            employees.push(data);
          }
        });
        if (employees.length > 0) {
          return employees.sort((a, b) => b.id.localeCompare(a.id));
        }
      } catch (error: any) {
        console.warn('Client Firestore getEmployees notice:', error?.message || error);
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
      const headers = await this.getAuthHeaders();
      const res = await fetch(`/api/employees/${id}`, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.employee) {
          return data.employee;
        }
      }
    } catch (err) {
      console.warn('Server API getEmployeeById notice:', err);
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
   * Add a new employee profile to the Server Database & Google Cloud Firestore
   */
  public static async addEmployee(
    empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> | Record<string, any>,
    options?: AddEmployeeOptions
  ): Promise<Employee> {
    const sanitizedEmpData = cleanFirestoreData(empData);
    const headers = await this.getAuthHeaders();

    // 1. First priority: Server API route (persists to serverDb & Firestore)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeData: sanitizedEmpData,
          portalPassword: options?.portalPassword || '',
          portalRole: options?.portalRole || 'employee',
          createdBy: options?.createdBy || 'Super Admin',
          creatorRole: options?.creatorRole || 'super_admin',
        }),
      });

      const data = await res.json();

      if (res.ok && data.employee) {
        const savedEmp: Employee = data.employee;

        // Also push to client Firestore if available
        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, this.collectionName, savedEmp.id), savedEmp, { merge: true });
          } catch {}
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { employee: savedEmp } }));
        }

        return savedEmp;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected employee creation.');
      }
    } catch (apiErr: any) {
      console.warn('Server API addEmployee notice:', apiErr.message);
      // If error is explicit user validation error, rethrow
      if (apiErr.message && !apiErr.message.includes('fetch')) {
        throw apiErr;
      }
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

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { employee: newEmp } }));
        }

        return newEmp;
      } catch (clientErr: any) {
        console.error('Client Firestore addEmployee error:', clientErr.message);
        throw new Error(clientErr.message || 'Failed to save employee to Firestore.');
      }
    }

    throw new Error('Could not connect to database server. Please check your network connection.');
  }

  /**
   * Update an existing employee in Server Database & Google Cloud Firestore
   */
  public static async updateEmployee(id: string, updates: Partial<Employee> | Record<string, any>): Promise<boolean> {
    if (!id) return false;
    const sanitizedUpdates = cleanFirestoreData(updates);
    const headers = await this.getAuthHeaders();

    // 1. Server API route (persists to serverDb & Firestore)
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sanitizedUpdates),
      });
      if (res.ok) {
        // Also sync to client Firestore
        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, this.collectionName, id), {
              ...sanitizedUpdates,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch {}
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { id, updates: sanitizedUpdates } }));
        }
        return true;
      }
    } catch (err) {
      console.warn('Server API updateEmployee notice:', err);
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await setDoc(docRef, {
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { id, updates: sanitizedUpdates } }));
        }
        return true;
      } catch (clientErr: any) {
        console.error('Client Firestore updateEmployee error:', clientErr.message);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { id, updates: sanitizedUpdates } }));
    }
    return true;
  }

  /**
   * Permanently delete an employee from server
   */
  public static async deleteEmployee(id: string): Promise<boolean> {
    if (!id) return false;
    const headers = await this.getAuthHeaders();

    // 1. Server API route
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        if (isFirebaseConfigured && db) {
          try {
            await deleteDoc(doc(db, this.collectionName, id));
          } catch {}
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { deletedId: id } }));
        }
        return true;
      }
    } catch (err) {
      console.warn('Server API deleteEmployee notice:', err);
    }

    // 2. Client Firestore fallback
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { deletedId: id } }));
    }
    return true;
  }
}
