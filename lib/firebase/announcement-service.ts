import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Announcement } from '@/types';

export class AnnouncementService {
  private static collectionName = 'announcements';

  public static async getAnnouncements(): Promise<Announcement[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const snap = await getDocs(collection(db, this.collectionName));
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Announcement));
      return list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    } catch (error: any) {
      console.error('Firestore getAnnouncements error:', error.message);
      return [];
    }
  }

  public static async addAnnouncement(ann: Partial<Announcement>): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;

    try {
      const id = ann.id || `ann-${Date.now()}`;
      const payload = cleanFirestoreData({ 
        ...ann, 
        id, 
        publishedAt: ann.publishedAt || new Date().toISOString() 
      });
      
      await setDoc(doc(db, this.collectionName, id), payload);
      return true;
    } catch (error: any) {
      console.error('Firestore addAnnouncement error:', error.message);
      return false;
    }
  }

  public static async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.collectionName, id), cleanFirestoreData(updates));
      return true;
    } catch (error: any) {
      console.error('Firestore updateAnnouncement error:', error.message);
      return false;
    }
  }

  public static async deleteAnnouncement(id: string): Promise<boolean> {
    if (!id || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error: any) {
      console.error('Firestore deleteAnnouncement error:', error.message);
      return false;
    }
  }
}
