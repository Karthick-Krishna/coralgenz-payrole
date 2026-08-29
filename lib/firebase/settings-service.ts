import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { Organization } from '@/types';
import { DEMO_ORGANIZATION } from '@/lib/demo/demo-data';

export class SettingsService {
  private static collectionName = 'companySettings';
  private static defaultDocId = 'org-coralgenz-01';

  public static async getSettings(): Promise<Organization> {
    if (!isFirebaseConfigured || !db) return DEMO_ORGANIZATION;

    try {
      const docRef = doc(db, this.collectionName, this.defaultDocId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return { ...DEMO_ORGANIZATION, ...snap.data(), id: snap.id } as Organization;
      } else {
        // Initialize settings in Firestore if not yet present
        const initialData = cleanFirestoreData({
          ...DEMO_ORGANIZATION,
          id: this.defaultDocId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await setDoc(docRef, initialData, { merge: true });
        return initialData as Organization;
      }
    } catch (err: any) {
      console.error('Firestore getSettings error:', err.message);
      return DEMO_ORGANIZATION;
    }
  }

  public static async saveSettings(org: Partial<Organization>): Promise<Organization> {
    if (!isFirebaseConfigured || !db) {
      return { ...DEMO_ORGANIZATION, ...org } as Organization;
    }

    try {
      const docRef = doc(db, this.collectionName, this.defaultDocId);
      const cleanData = cleanFirestoreData({
        ...org,
        id: this.defaultDocId,
        updatedAt: new Date().toISOString(),
      });

      await setDoc(docRef, cleanData, { merge: true });
      return { ...DEMO_ORGANIZATION, ...cleanData } as Organization;
    } catch (err: any) {
      console.error('Firestore saveSettings error:', err.message);
      throw new Error(err.message || 'Failed to save settings to Firestore.');
    }
  }
}
