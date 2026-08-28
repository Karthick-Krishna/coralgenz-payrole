import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Announcement } from '@/types';

export class AnnouncementService {
  public static async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.announcements)) {
          return data.announcements;
        }
      }
    } catch {}

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        const list: Announcement[] = [];
        snap.forEach((d) => list.push(d.data() as Announcement));
        return list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      } catch {}
    }

    return [];
  }

  public static async addAnnouncement(ann: Partial<Announcement>): Promise<boolean> {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ann,
          publishedAt: ann.publishedAt || new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch {
      if (isFirebaseConfigured && db) {
        try {
          const id = ann.id || `ann-${Date.now()}`;
          await setDoc(doc(db, 'announcements', id), cleanFirestoreData({ ...ann, id, publishedAt: ann.publishedAt || new Date().toISOString() }), { merge: true });
          return true;
        } catch {}
      }
      return false;
    }
  }
}
