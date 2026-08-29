import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { Holiday } from '@/types';

export class HolidayService {
  private static collectionName = 'holidays';

  public static async getHolidays(): Promise<Holiday[]> {
    if (!isFirebaseConfigured || !db) return [];
    
    try {
      const q = query(collection(db, this.collectionName), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      const list: Holiday[] = [];
      snap.forEach(d => list.push({ ...d.data(), id: d.id } as Holiday));
      return list;
    } catch (e) {
      console.warn('Firestore getHolidays error:', e);
      return [];
    }
  }
}
