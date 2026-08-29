import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Holiday } from '@/types';
import { DEMO_HOLIDAYS } from '@/lib/demo/demo-data';

export class HolidayService {
  private static collectionName = 'holidays';

  public static async getHolidays(): Promise<Holiday[]> {
    if (!isFirebaseConfigured || !db) return DEMO_HOLIDAYS;

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      if (snap.empty) {
        // Seed default holidays into Firestore
        for (const hol of DEMO_HOLIDAYS) {
          await setDoc(doc(db, this.collectionName, hol.id), cleanFirestoreData(hol));
        }
        return DEMO_HOLIDAYS;
      }
      const list: Holiday[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Holiday));
      return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } catch (e) {
      console.warn('Firestore getHolidays error:', e);
      return DEMO_HOLIDAYS;
    }
  }

  public static async addHoliday(holiday: Partial<Holiday>): Promise<Holiday | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const id = holiday.id || `hol-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...holiday,
        id,
        organizationId: holiday.organizationId || 'org-coralgenz-01',
      }) as Holiday;

      await setDoc(doc(db, this.collectionName, id), payload);
      return payload;
    } catch (error: any) {
      console.error('Firestore addHoliday error:', error.message);
      return null;
    }
  }

  public static async updateHoliday(id: string, updates: Partial<Holiday>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, cleanFirestoreData(updates));
      return true;
    } catch (error: any) {
      console.error('Firestore updateHoliday error:', error.message);
      return false;
    }
  }

  public static async deleteHoliday(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error: any) {
      console.error('Firestore deleteHoliday error:', error.message);
      return false;
    }
  }
}
