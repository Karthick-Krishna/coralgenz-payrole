import { collection, doc, getDocs, setDoc, query, where, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { AttendanceRecord } from '@/types';

export class AttendanceService {
  private static collectionName = 'attendance';

  public static async getAttendance(employeeId?: string): Promise<AttendanceRecord[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      let q = query(collection(db, this.collectionName));
      if (employeeId) {
        q = query(collection(db, this.collectionName), where('employeeId', '==', employeeId));
      }
      const snap = await getDocs(q);
      const records: AttendanceRecord[] = [];
      snap.forEach((d) => records.push({ ...d.data(), id: d.id } as AttendanceRecord));
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error: any) {
      console.error('Firestore getAttendance error:', error.message);
      return [];
    }
  }

  public static async logAttendance(record: Partial<AttendanceRecord>): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !record.employeeId || !record.date) return false;

    try {
      const id = record.id || `att-${record.employeeId}-${record.date}`;
      const payload = cleanFirestoreData({ ...record, id });
      
      await setDoc(doc(db, this.collectionName, id), payload, { merge: true });
      return true;
    } catch (error: any) {
      console.error('Firestore logAttendance error:', error.message);
      return false;
    }
  }
}
