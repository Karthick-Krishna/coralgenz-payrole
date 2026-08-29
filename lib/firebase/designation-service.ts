import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Designation } from '@/types';
import { DEMO_DESIGNATIONS } from '@/lib/demo/demo-data';

export class DesignationService {
  private static collectionName = 'designations';

  public static async getDesignations(): Promise<Designation[]> {
    if (!isFirebaseConfigured || !db) return DEMO_DESIGNATIONS;

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      if (snap.empty) {
        // Seed default designations into Firestore
        for (const desig of DEMO_DESIGNATIONS) {
          await setDoc(doc(db, this.collectionName, desig.id), cleanFirestoreData(desig));
        }
        return DEMO_DESIGNATIONS;
      }
      const list: Designation[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Designation));
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } catch (error: any) {
      console.error('Firestore getDesignations error:', error.message);
      return DEMO_DESIGNATIONS;
    }
  }

  public static async addDesignation(designation: Partial<Designation>): Promise<Designation | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const id = designation.id || `desig-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...designation,
        id,
        organizationId: designation.organizationId || 'org-coralgenz-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) as Designation;

      await setDoc(doc(db, this.collectionName, id), payload);
      return payload;
    } catch (error: any) {
      console.error('Firestore addDesignation error:', error.message);
      return null;
    }
  }

  public static async updateDesignation(id: string, updates: Partial<Designation>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }));
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
