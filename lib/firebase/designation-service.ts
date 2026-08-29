import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Designation } from '@/types';

export class DesignationService {
  private static collectionName = 'designations';

  public static async getDesignations(): Promise<Designation[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      const list: Designation[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Designation));
      return list.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error: any) {
      console.error('Firestore getDesignations error:', error.message);
      return [];
    }
  }

  public static async addDesignation(designation: Partial<Designation>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = designation.id || `desig-${Date.now()}`;
      const payload = cleanFirestoreData({ ...designation, id });
      
      await setDoc(doc(db, this.collectionName, id), payload);
      return true;
    } catch (error: any) {
      console.error('Firestore addDesignation error:', error.message);
      return false;
    }
  }

  public static async updateDesignation(id: string, updates: Partial<Designation>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.collectionName, id), cleanFirestoreData(updates));
      return true;
    } catch (error: any) {
      console.error('Firestore updateDesignation error:', error.message);
      return false;
    }
  }

  public static async deleteDesignation(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error: any) {
      console.error('Firestore deleteDesignation error:', error.message);
      return false;
    }
  }
}
