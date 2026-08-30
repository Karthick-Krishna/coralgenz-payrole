import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { FirestoreRest } from './firestore-rest';
import { AuditService } from './audit-service';
import { EmployeeRequest } from '@/types';

export class RequestService {
  private static collectionName = 'requests';

  public static async getRequests(employeeId?: string): Promise<EmployeeRequest[]> {
    let list: EmployeeRequest[] = [];

    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, this.collectionName));
        if (employeeId) {
          q = query(collection(db, this.collectionName), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as EmployeeRequest));
      } catch (error: any) {
        console.warn('Firestore getRequests notice:', error.message);
      }
    }

    if (list.length === 0) {
      try {
        const restDocs = await FirestoreRest.getDocuments(this.collectionName);
        if (employeeId) {
          list = restDocs.filter((r: any) => r.employeeId === employeeId);
        } else {
          list = restDocs;
        }
      } catch {}
    }

    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public static async submitRequest(req: Partial<EmployeeRequest>): Promise<boolean> {
    const id = req.id || `req-${Date.now()}`;
    const payload = cleanFirestoreData({
      ...req,
      id,
      status: req.status || 'pending',
      createdAt: req.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let saved = false;

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, this.collectionName, id), payload, { merge: true });
        saved = true;
      } catch (error: any) {
        console.warn('Firestore submitRequest notice:', error.message);
      }
    }

    if (!saved) {
      try {
        saved = await FirestoreRest.setDocument(this.collectionName, id, payload);
      } catch {}
    }

    return saved;
  }

  public static async deleteRequest(
    id: string,
    adminUser?: { id: string; name: string; role?: string },
    reason?: string
  ): Promise<boolean> {
    if (!id) return false;

    let deleted = false;

    // 1. Primary: Server API deletion
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          deleted = true;
        }
      } catch (apiErr) {
        console.warn('API deleteRequest notice:', apiErr);
      }
    }

    // 2. Direct Google Cloud Firestore REST API deletion
    if (!deleted) {
      try {
        deleted = await FirestoreRest.deleteDocument(this.collectionName, id);
      } catch {}
    }

    // 3. Direct Firestore Client SDK
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.collectionName, id));
        deleted = true;
      } catch (clientErr: any) {
        console.warn('Client SDK deleteDoc notice:', clientErr.message);
      }
    }

    // 4. Audit Log
    try {
      await AuditService.logAction({
        action: 'EMPLOYEE_REQUEST_DELETED',
        module: 'requests',
        details: `Deleted ticket ${id}. Reason: ${reason || 'User requested deletion'}`,
        userId: adminUser?.id || 'usr-admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        recordId: id,
        recordTitle: `Ticket ${id}`,
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
    }

    return deleted;
  }
}
