import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { AttendanceRecord } from '@/types';

export class AttendanceService {
  public static async getAttendance(employeeId?: string): Promise<AttendanceRecord[]> {
    try {
      const url = employeeId ? `/api/attendance?employeeId=${encodeURIComponent(employeeId)}` : '/api/attendance';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.records)) {
          return data.records;
        }
      }
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, 'attendance'));
        if (employeeId) {
          q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        const records: AttendanceRecord[] = [];
        snap.forEach((d) => records.push(d.data() as AttendanceRecord));
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch {}
    }

    return [];
  }

  public static async logAttendance(record: Partial<AttendanceRecord>): Promise<boolean> {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      if (isFirebaseConfigured && db && record.employeeId && record.date) {
        try {
          const id = record.id || `att-${record.employeeId}-${record.date}`;
          await setDoc(doc(db, 'attendance', id), cleanFirestoreData({ ...record, id }), { merge: true });
          return true;
        } catch {}
      }
      return false;
    }
  }
}
