import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Department } from '@/types';
import { DEMO_DEPARTMENTS } from '@/lib/demo/demo-data';

export class DepartmentService {
  private static collectionName = 'departments';

  public static async getDepartments(): Promise<Department[]> {
    if (!isFirebaseConfigured || !db) return DEMO_DEPARTMENTS;

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      if (snap.empty) {
        // Seed default departments into Firestore
        for (const dept of DEMO_DEPARTMENTS) {
          await setDoc(doc(db, this.collectionName, dept.id), cleanFirestoreData(dept));
        }
        return DEMO_DEPARTMENTS;
      }
      const list: Department[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Department));
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error: any) {
      console.error('Firestore getDepartments error:', error.message);
      return DEMO_DEPARTMENTS;
    }
  }

  public static async addDepartment(dept: Partial<Department>): Promise<Department | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const id = dept.id || `dept-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...dept,
        id,
        organizationId: dept.organizationId || 'org-coralgenz-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) as Department;

      await setDoc(doc(db, this.collectionName, id), payload);
      return payload;
    } catch (error: any) {
      console.error('Firestore addDepartment error:', error.message);
      return null;
    }
  }

  public static async updateDepartment(id: string, updates: Partial<Department>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }));
      return true;
    } catch (error: any) {
      console.error('Firestore updateDepartment error:', error.message);
      return false;
    }
  }

  public static async deleteDepartment(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error: any) {
      console.error('Firestore deleteDepartment error:', error.message);
      return false;
    }
  }
}
