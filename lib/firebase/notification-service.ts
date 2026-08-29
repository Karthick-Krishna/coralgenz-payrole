import { collection, doc, getDocs, setDoc, query, where, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { NotificationItem } from '@/types';

export class NotificationService {
  private static collectionName = 'notifications';

  public static async getNotifications(userId?: string): Promise<NotificationItem[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      let q = query(collection(db, this.collectionName));
      if (userId) {
        q = query(collection(db, this.collectionName), where('userId', '==', userId));
      }
      const snap = await getDocs(q);
      const list: NotificationItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as NotificationItem));
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
      console.error('Firestore getNotifications error:', error.message);
      return [];
    }
  }

  public static async markAllRead(userId?: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      let q = query(collection(db, this.collectionName));
      if (userId) {
        q = query(collection(db, this.collectionName), where('userId', '==', userId));
      }
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, this.collectionName, d.id), { read: true, isRead: true });
      }
      return true;
    } catch (error: any) {
      console.error('Firestore markAllRead error:', error.message);
      return false;
    }
  }

  public static async markAllAsRead(userId?: string): Promise<boolean> {
    return this.markAllRead(userId);
  }

  public static async markAsRead(notificationId: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db || !notificationId) return false;

    try {
      await updateDoc(doc(db, this.collectionName, notificationId), { read: true, isRead: true });
      return true;
    } catch (error: any) {
      console.error('Firestore markAsRead error:', error.message);
      return false;
    }
  }

  public static async addNotification(notif: Partial<NotificationItem>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = notif.id || `notif-${Date.now()}`;
      const payload = cleanFirestoreData({
        ...notif,
        id,
        isRead: notif.isRead ?? false,
        createdAt: new Date().toISOString(),
      });
      await setDoc(doc(db, this.collectionName, id), payload);
      return true;
    } catch (error: any) {
      console.error('Firestore addNotification error:', error.message);
      return false;
    }
  }
}
