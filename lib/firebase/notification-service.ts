import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
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

  public static async markAsRead(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.collectionName, id), { isRead: true });
      return true;
    } catch (error: any) {
      console.error('Firestore markAsRead error:', error.message);
      return false;
    }
  }

  public static async markAllAsRead(userId: string): Promise<boolean> {
    if (!userId || !isFirebaseConfigured || !db) return false;

    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId), where('isRead', '==', false));
      const snap = await getDocs(q);
      const updates = snap.docs.map(d => updateDoc(doc(db!, this.collectionName, d.id), { isRead: true }));
      await Promise.all(updates);
      return true;
    } catch (error: any) {
      console.error('Firestore markAllAsRead error:', error.message);
      return false;
    }
  }

  public static async addNotification(notif: Partial<NotificationItem>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = notif.id || `notif-${Date.now()}`;
      const payload = cleanFirestoreData({ ...notif, id, isRead: false, createdAt: new Date().toISOString() });
      await setDoc(doc(db, this.collectionName, id), payload);
      return true;
    } catch (error: any) {
      console.error('Firestore addNotification error:', error.message);
      return false;
    }
  }
}
