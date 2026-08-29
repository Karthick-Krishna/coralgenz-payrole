import { collection, addDoc, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  recordId?: string;
  recordTitle?: string;
  details: string;
  timestamp: string;
}

export class AuditService {
  private static collectionName = 'audit_logs';

  /**
   * Log an audit event directly to Server Database & Firestore
   */
  public static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, this.collectionName), {
          ...entry,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.warn('AuditService.logAction Firestore notice:', error?.message || error);
      }
    }
  }

  /**
   * Retrieve audit logs directly from Server Database with Firestore fallback
   */
  public static async getLogs(limitCount = 100): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          return data.logs;
        }
      }
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, this.collectionName),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        const logs: AuditLogEntry[] = [];
        querySnapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEntry);
        });
        return logs;
      } catch (error: any) {
        console.warn('AuditService.getLogs Firestore notice:', error?.message || error);
        return [];
      }
    }

    return [];
  }
}
