import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { EmployeeRequest } from '@/types';

export class RequestService {
  private static collectionName = 'requests';

  public static async getRequests(employeeId?: string): Promise<EmployeeRequest[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      let q = query(collection(db, this.collectionName));
      if (employeeId) {
        q = query(collection(db, this.collectionName), where('employeeId', '==', employeeId));
      }
      const snap = await getDocs(q);
      const list: EmployeeRequest[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as EmployeeRequest));
      return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (error: any) {
      console.error('Firestore getRequests error:', error.message);
      return [];
    }
  }

  public static async submitRequest(req: Partial<EmployeeRequest>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = req.id || `req-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...req,
        id,
        status: req.status || 'pending',
        createdAt: req.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, this.collectionName, id), payload, { merge: true });
      return true;
    } catch (error: any) {
      console.error('Firestore submitRequest error:', error.message);
      return false;
    }
  }

  public static async deleteRequest(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error: any) {
      console.error('Firestore deleteRequest error:', error.message);
      return false;
    }
  }
}
