import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { AuditService } from './audit-service';
import { LeaveRequest, LeaveBalance } from '@/types';

export class LeaveService {
  private static reqCollectionName = 'leaveRequests';
  private static balCollectionName = 'leaveBalances';

  public static async getLeaves(employeeId?: string): Promise<{ requests: LeaveRequest[]; balance: LeaveBalance | null }> {
    if (!isFirebaseConfigured || !db) return { requests: [], balance: null };

    try {
      let q = query(collection(db, this.reqCollectionName));
      if (employeeId) {
        q = query(collection(db, this.reqCollectionName), where('employeeId', '==', employeeId));
      }
      const snap = await getDocs(q);
      const requests: LeaveRequest[] = [];
      snap.forEach((d) => requests.push({ ...d.data(), id: d.id } as LeaveRequest));

      let balance: LeaveBalance | null = null;
      if (employeeId) {
        const balDoc = await getDoc(doc(db, this.balCollectionName, `lb-${employeeId}-2026`));
        if (balDoc.exists()) {
          balance = { ...balDoc.data(), id: balDoc.id } as LeaveBalance;
        } else {
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
          await setDoc(doc(db, this.balCollectionName, balance.id), cleanFirestoreData(balance));
        }
      }

      return { requests: requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()), balance };
    } catch (error: any) {
      console.error('Firestore getLeaves error:', error.message);
      return { requests: [], balance: null };
    }
  }

  public static async submitLeaveRequest(req: Partial<LeaveRequest>): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !req.employeeId) return false;

    try {
      const id = req.id || `leave-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...req,
        id,
        status: req.status || 'pending',
        createdAt: req.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      await setDoc(doc(db, this.reqCollectionName, id), payload, { merge: true });
      return true;
    } catch (error: any) {
      console.error('Firestore submitLeaveRequest error:', error.message);
      return false;
    }
  }

  public static async updateLeaveStatus(requestId: string, status: string, approverNotes?: string): Promise<boolean> {
    if (!requestId || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.reqCollectionName, requestId), cleanFirestoreData({ status, approverNotes, updatedAt: new Date().toISOString() }));
      return true;
    } catch (error: any) {
      console.error('Firestore updateLeaveStatus error:', error.message);
      return false;
    }
  }

  public static async deleteLeaveRequest(
    id: string,
    adminUser?: { id: string; name: string; role?: string },
    reason?: string
  ): Promise<boolean> {
    if (!id) return false;

    // 1. Try Server API
    try {
      const res = await fetch(`/api/leave?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coralgenz_store_updated'));
        }
        return true;
      }
    } catch {}

    // 2. Direct Firestore Client SDK
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, this.reqCollectionName, id);
        const snap = await getDoc(docRef);
        const leaveData = snap.exists() ? (snap.data() as LeaveRequest) : null;

        await deleteDoc(docRef);

        try {
          await AuditService.logAction({
            action: 'LEAVE_REQUEST_DELETED',
            module: 'leave',
            details: `Deleted leave application ${id} for employee ${leaveData?.employeeName || leaveData?.employeeId || ''} (${leaveData?.startDate || ''} to ${leaveData?.endDate || ''}). Reason: ${reason || 'User/Admin requested deletion'}`,
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
        return true;
      } catch (err: any) {
        console.error('Firestore deleteLeaveRequest error:', err.message);
        return false;
      }
    }
    return false;
  }
}
