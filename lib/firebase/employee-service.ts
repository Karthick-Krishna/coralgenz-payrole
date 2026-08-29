import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
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
   * Fetch all active employees directly from Google Cloud Firestore
   */
  public static async getEmployees(): Promise<Employee[]> {
    if (!isFirebaseConfigured || !db) return [];
    
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
      
      return employees.sort((a, b) => b.id.localeCompare(a.id));
    } catch (error: any) {
      console.error('Firestore getEmployees error:', error?.message || error);
      return [];
    }
  }

  /**
   * Get single employee by ID from Firestore
   */
  public static async getEmployeeById(id: string): Promise<Employee | null> {
    if (!id || !isFirebaseConfigured || !db) return null;

    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Employee;
      }
    } catch (error: any) {
      console.error(`Firestore getEmployeeById error:`, error?.message || error);
    }
    return null;
  }

  /**
   * Add a new employee profile to Firestore and create an Auth account
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
      // 1. Generate new Document ID
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

      // Save to Firestore
      await setDoc(doc(db, this.collectionName, nextId), newEmp);

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
   * Update an existing employee in Firestore
   */
  public static async updateEmployee(id: string, updates: Partial<Employee> | Record<string, any>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;
    
    const sanitizedUpdates = cleanFirestoreData(updates);

    try {
      const docRef = doc(db, this.collectionName, id);
      // Use updateDoc instead of setDoc with merge to ensure it only updates existing docs safely
      await updateDoc(docRef, {
        ...sanitizedUpdates,
        updatedAt: new Date().toISOString(),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { id, updates: sanitizedUpdates } }));
      }
      return true;
    } catch (err: any) {
      console.error('Firestore updateEmployee error:', err.message);
      
      // Fallback to setDoc if updateDoc fails due to non-existent document
      if (err.code === 'not-found') {
        try {
          await setDoc(doc(db, this.collectionName, id), {
            ...sanitizedUpdates,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('coralgenz_store_updated', { detail: { id, updates: sanitizedUpdates } }));
          }
          return true;
        } catch (setErr) {
          console.error('Firestore setDoc fallback error:', setErr);
        }
      }
      return false;
    }
  }

  /**
   * Permanently delete an employee from Firestore
   */
  public static async deleteEmployee(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      
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
