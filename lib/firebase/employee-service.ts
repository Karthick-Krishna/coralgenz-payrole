import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { Employee } from '@/types';

export class EmployeeService {
  private static collectionName = 'employees';

  /**
   * Fetch all active employees directly from Firestore
   */
  public static async getEmployees(): Promise<Employee[]> {
    if (!isFirebaseConfigured || !db) {
      console.error('Firebase is not configured.');
      return [];
    }

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

      // Sort by joining date or ID descending
      return employees.sort((a, b) => b.id.localeCompare(a.id));
    } catch (error: any) {
      console.error('Firestore getEmployees error:', error?.message || error);
      return [];
    }
  }

  /**
   * Get single employee by ID directly from Firestore
   */
  public static async getEmployeeById(id: string): Promise<Employee | null> {
    if (!isFirebaseConfigured || !db || !id) {
      return null;
    }

    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Employee;
      }
      return null;
    } catch (error: any) {
      console.error(`Firestore getEmployeeById (${id}) error:`, error?.message || error);
      return null;
    }
  }

  /**
   * Add a new employee profile directly to Firestore
   */
  public static async addEmployee(empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase Firestore is not initialized.');
    }

    // 1. Get existing employee count from Firestore to generate sequential ID
    const existingSnapshot = await getDocs(collection(db, this.collectionName));
    const count = existingSnapshot.size;
    const nextId = `CGG-EMP-${String(count + 1).padStart(4, '0')}`;

    const newEmp: Employee = {
      ...empData,
      id: nextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Write directly to Firestore server
    await setDoc(doc(db, this.collectionName, nextId), newEmp);

    return newEmp;
  }

  /**
   * Update an existing employee in Firestore
   */
  public static async updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !id) {
      return false;
    }

    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Deactivate/Soft-delete an employee in Firestore
   */
  public static async deleteEmployee(id: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !id) {
      return false;
    }

    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    });

    return true;
  }
}
