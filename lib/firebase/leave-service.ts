import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { FirestoreRest } from './firestore-rest';
import { AuditService } from './audit-service';
import { LeaveRequest, LeaveBalance } from '@/types';

export class LeaveService {
  private static reqCollectionName = 'leaveRequests';
  private static balCollectionName = 'leaveBalances';

  public static async getLeaves(employeeId?: string): Promise<{ requests: LeaveRequest[]; balance: LeaveBalance | null }> {
    let requests: LeaveRequest[] = [];
    let balance: LeaveBalance | null = null;

    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, this.reqCollectionName));
        if (employeeId) {
          q = query(collection(db, this.reqCollectionName), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        snap.forEach((d) => requests.push({ ...d.data(), id: d.id } as LeaveRequest));
      } catch (error: any) {
        console.warn('Firestore getLeaves notice:', error.message);
      }
    }

    if (requests.length === 0) {
      try {
        const restDocs = await FirestoreRest.getDocuments(this.reqCollectionName);
        if (employeeId) {
          requests = restDocs.filter((r: any) => r.employeeId === employeeId);
        } else {
          requests = restDocs;
        }
      } catch {}
    }

    if (employeeId) {
      try {
        if (isFirebaseConfigured && db) {
          const balDoc = await getDoc(doc(db, this.balCollectionName, `lb-${employeeId}-2026`));
          if (balDoc.exists()) {
            balance = { ...balDoc.data(), id: balDoc.id } as LeaveBalance;
          }
        }
      } catch {}

      if (!balance) {
        balance = {
          id: `lb-${employeeId}-2026`,
          organizationId: 'org-coralgenz-01',
          employeeId,
          year: 2026,
          casual: { allocated: 12, used: 0, remaining: 12 },
          sick: { allocated: 10, used: 0, remaining: 10 },
          annual: { allocated: 15, used: 0, remaining: 15 },
          earned: { allocated: 15, used: 0, remaining: 15 },
          maternity: { allocated: 182, used: 0, remaining: 182 },
          paternity: { allocated: 15, used: 0, remaining: 15 },
          unpaid: { used: 0 },
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return {
      requests: requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
      balance,
    };
  }

  public static async submitLeaveRequest(req: Partial<LeaveRequest>): Promise<boolean> {
    if (!req.employeeId) return false;

    const id = req.id || `leave-${Date.now()}`;
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
        await setDoc(doc(db, this.reqCollectionName, id), payload, { merge: true });
        saved = true;
      } catch (error: any) {
        console.warn('Firestore submitLeaveRequest notice:', error.message);
      }
    }

    if (!saved) {
      try {
        saved = await FirestoreRest.setDocument(this.reqCollectionName, id, payload);
      } catch {}
    }

    return saved;
  }

  public static async updateLeaveStatus(requestId: string, status: string, approverNotes?: string): Promise<boolean> {
    if (!requestId) return false;

    const updates = cleanFirestoreData({
      status,
      approverNotes,
      updatedAt: new Date().toISOString(),
    });

    let updated = false;

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, this.reqCollectionName, requestId), updates);
        updated = true;
      } catch (error: any) {
        try {
          await setDoc(doc(db, this.reqCollectionName, requestId), updates, { merge: true });
          updated = true;
        } catch {}
      }
    }

    if (!updated) {
      try {
        updated = await FirestoreRest.setDocument(this.reqCollectionName, requestId, updates);
      } catch {}
    }

    return updated;
  }

  public static async deleteLeaveRequest(
    id: string,
    adminUser?: { id: string; name: string; role?: string },
    reason?: string
  ): Promise<boolean> {
    if (!id) return false;

    let deleted = false;

    // 1. Primary: Server API deletion
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/leave?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          deleted = true;
        }
      } catch (apiErr) {
        console.warn('API deleteLeave error:', apiErr);
      }
    }

    // 2. Direct Google Cloud Firestore REST API
    if (!deleted) {
      try {
        deleted = await FirestoreRest.deleteDocument(this.reqCollectionName, id);
      } catch {}
    }

    // 3. Direct Firestore Client SDK
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, this.reqCollectionName, id));
        deleted = true;
      } catch (clientErr: any) {
        console.warn('Client SDK deleteDoc notice:', clientErr.message);
      }
    }

    // 4. Audit Log
    try {
      await AuditService.logAction({
        action: 'LEAVE_REQUEST_DELETED',
        module: 'leave',
        details: `Deleted leave record ${id}. Reason: ${reason || 'User requested deletion'}`,
        userId: adminUser?.id || 'usr-admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        recordId: id,
        recordTitle: `Leave Request ${id}`,
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
    }

    return deleted;
  }
}
