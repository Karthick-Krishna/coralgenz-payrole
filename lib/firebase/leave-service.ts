import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { LeaveRequest, LeaveBalance } from '@/types';

export class LeaveService {
  public static async getLeaves(employeeId?: string): Promise<{ requests: LeaveRequest[]; balance: LeaveBalance | null }> {
    try {
      const url = employeeId ? `/api/leave?employeeId=${encodeURIComponent(employeeId)}` : '/api/leave';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return { requests: data.requests || [], balance: data.balance || null };
      }
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        let q = query(collection(db, 'leaveRequests'));
        if (employeeId) {
          q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
        }
        const snap = await getDocs(q);
        const requests: LeaveRequest[] = [];
        snap.forEach((d) => requests.push(d.data() as LeaveRequest));

        let balance: LeaveBalance | null = null;
        if (employeeId) {
          const balDoc = await getDoc(doc(db, 'leaveBalances', `lb-${employeeId}-2026`));
          if (balDoc.exists()) {
            balance = balDoc.data() as LeaveBalance;
          }
        }

        return { requests, balance };
      } catch {}
    }

    return { requests: [], balance: null };
  }

  public static async submitLeaveRequest(req: Partial<LeaveRequest>): Promise<boolean> {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', leaveRequest: req }),
      });
      return res.ok;
    } catch {
      if (isFirebaseConfigured && db && req.employeeId) {
        try {
          const id = req.id || `leave-${Date.now()}`;
          await setDoc(doc(db, 'leaveRequests', id), cleanFirestoreData({ ...req, id }), { merge: true });
          return true;
        } catch {}
      }
      return false;
    }
  }

  public static async updateLeaveStatus(requestId: string, status: string, approverNotes?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          requestId,
          updateData: { status, approverNotes },
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
