import { collection, addDoc, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { MockDataStore } from '@/lib/store/mock-store';
import { UserRole } from '@/types';

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
    // 1. Log to local store
    try {
      MockDataStore.logAudit({
        userId: entry.userId,
        userName: entry.userName,
        userRole: (entry.userRole || 'employee') as UserRole,
        action: entry.action as any,
        module: entry.module as any,
        recordId: entry.recordId,
        recordTitle: entry.recordTitle,
        details: entry.details,
      });
    } catch {
      // Ignore
    }

    // 2. Sync with Firestore if active
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, this.collectionName), {
          ...entry,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Silently fallback without spamming console
      }
    }
  }

  public static async getLogs(limitCount = 100): Promise<AuditLogEntry[]> {
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
        if (logs.length > 0) return logs;
      } catch {
        // Fallback to local store
      }
    }

    return MockDataStore.getAuditLogs().map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.userName,
      userRole: l.userRole,
      action: l.action,
      module: l.module,
      recordId: l.recordId,
      recordTitle: l.recordTitle,
      details: l.details,
      timestamp: l.timestamp,
    }));
  }
}
