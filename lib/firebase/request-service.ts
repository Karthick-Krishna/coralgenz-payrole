import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { AuditService } from './audit-service';
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

  public static async deleteRequest(
    id: string,
    adminUser?: { id: string; name: string; role?: string },
    reason?: string
  ): Promise<boolean> {
    if (!id) return false;

    // 1. Try Server API
    try {
      const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
        }
        return true;
      }
    } catch {}

    // 2. Direct Firestore SDK
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const snap = await getDoc(docRef);
        const reqData = snap.exists() ? (snap.data() as EmployeeRequest) : null;

        await deleteDoc(docRef);

        try {
          await AuditService.logAction({
            action: 'EMPLOYEE_REQUEST_DELETED',
            module: 'requests',
            details: `Deleted ticket ${id} (${reqData?.type || ''} - ${reqData?.title || ''}) for ${reqData?.employeeName || reqData?.employeeId || ''}. Reason: ${reason || 'User/Admin requested deletion'}`,
            userId: adminUser?.id || 'usr-admin',
            userName: adminUser?.name || 'Administrator',
            userRole: adminUser?.role || 'admin',
            recordId: id,
            recordTitle: `Ticket ${id} - ${reqData?.title || ''}`,
          });
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
        }
        return true;
      } catch (error: any) {
        console.error('Firestore deleteRequest error:', error.message);
        return false;
      }
    }
    return false;
  }
}
