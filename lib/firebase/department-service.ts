import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Department } from '@/types';

export class DepartmentService {
  private static collectionName = 'departments';

  public static async getDepartments(): Promise<Department[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      const list: Department[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Department));
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      console.error('Firestore getDepartments error:', error.message);
      return [];
    }
  }

  public static async addDepartment(dept: Partial<Department>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = dept.id || `dept-${Date.now()}`;
      const payload = cleanFirestoreData({ ...dept, id });
      
      await setDoc(doc(db, this.collectionName, id), payload);
      return true;
    } catch (error: any) {
      console.error('Firestore addDepartment error:', error.message);
      return false;
    }
  }

  public static async updateDepartment(id: string, updates: Partial<Department>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.collectionName, id), cleanFirestoreData(updates));
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
