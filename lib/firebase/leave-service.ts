import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
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
        }
      }

      return { requests, balance };
    } catch (error: any) {
      console.error('Firestore getLeaves error:', error.message);
      return { requests: [], balance: null };
    }
  }

  public static async submitLeaveRequest(req: Partial<LeaveRequest>): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !req.employeeId) return false;

    try {
      const id = req.id || `leave-${Date.now()}`;
      const payload = cleanFirestoreData({ ...req, id });
      
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
      await updateDoc(doc(db, this.reqCollectionName, requestId), cleanFirestoreData({ status, approverNotes }));
      return true;
    } catch (error: any) {
      console.error('Firestore updateLeaveStatus error:', error.message);
      return false;
    }
  }
}
