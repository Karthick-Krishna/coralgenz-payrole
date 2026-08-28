import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { EmployeeRequest } from '@/types';

export class RequestService {
  public static async getRequests(employeeId?: string): Promise<EmployeeRequest[]> {
    try {
      const url = employeeId ? `/api/requests?employeeId=${encodeURIComponent(employeeId)}` : '/api/requests';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.requests)) {
          return data.requests;
        }
      }
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, 'requests'));
        if (employeeId) {
          q = query(collection(db, 'requests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        const list: EmployeeRequest[] = [];
        snap.forEach((d) => list.push(d.data() as EmployeeRequest));
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch {}
    }

    return [];
  }

  public static async submitRequest(req: Partial<EmployeeRequest>): Promise<boolean> {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      return res.ok;
    } catch {
      if (isFirebaseConfigured && db) {
        try {
          const id = req.id || `req-${Date.now()}`;
          await setDoc(doc(db, 'requests', id), cleanFirestoreData({ ...req, id }), { merge: true });
          return true;
        } catch {}
      }
      return false;
    }
  }
}
