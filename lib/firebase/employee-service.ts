import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { MockDataStore } from '@/lib/store/mock-store';
import { Employee } from '@/types';

export class EmployeeService {
  private static collectionName = 'employees';

  public static async getEmployees(): Promise<Employee[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, this.collectionName), where('status', '!=', 'inactive'));
        const querySnapshot = await getDocs(q);
        const employees: Employee[] = [];
        querySnapshot.forEach((docSnap) => {
          employees.push(docSnap.data() as Employee);
        });

        if (employees.length > 0) {
          return employees;
        }
      } catch (error: any) {
        console.warn('Firestore employee fetch notice (falling back to store):', error?.message || error);
      }
    }

    // Fallback to local store
    return MockDataStore.getEmployees();
  }

  public static async getEmployeeById(id: string): Promise<Employee | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Employee;
        }
      } catch (error: any) {
        console.warn('Firestore employee lookup notice (falling back to store):', error?.message || error);
      }
    }

    // Fallback to local store
    return MockDataStore.getEmployeeById(id) || null;
  }

  public static async addEmployee(empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee | null> {
    // 1. Create in MockDataStore for instant UI responsiveness
    const newEmp = MockDataStore.addEmployee(empData);

    // 2. Sync with Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, this.collectionName, newEmp.id), newEmp);
      } catch (error: any) {
        console.warn('Firestore addEmployee sync notice:', error?.message || error);
      }
    }

    return newEmp;
  }

  public static async updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
    // 1. Update in MockDataStore
    MockDataStore.updateEmployee(id, updates);

    // 2. Sync with Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (error: any) {
        console.warn('Firestore updateEmployee sync notice:', error?.message || error);
      }
    }

    return true;
  }

  public static async deleteEmployee(id: string): Promise<boolean> {
    // 1. Delete in MockDataStore
    MockDataStore.deleteEmployee(id);

    // 2. Sync with Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
          status: 'inactive',
          updatedAt: new Date().toISOString(),
        });
      } catch (error: any) {
        console.warn('Firestore deleteEmployee sync notice:', error?.message || error);
      }
    }

    return true;
  }
}
