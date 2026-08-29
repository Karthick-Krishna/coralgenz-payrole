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

  public static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      await addDoc(collection(db, this.collectionName), {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Firestore AuditService.logAction error:', error.message);
    }
  }

  public static async getLogs(limitCount = 100): Promise<AuditLogEntry[]> {
    if (!isFirebaseConfigured || !db) return [];

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
      console.error('Firestore AuditService.getLogs error:', error.message);
      return [];
    }
  }
}
