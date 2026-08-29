import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { cleanFirestoreData } from './sanitize';
import { SalaryStructure } from '@/types';
import { DEMO_SALARY_STRUCTURE } from '@/lib/demo/demo-data';

export class SalaryStructureService {
  private static collectionName = 'salaryStructures';
  private static defaultDocId = 'struct-01';

  public static async getSalaryStructure(): Promise<SalaryStructure> {
    if (!isFirebaseConfigured || !db) return DEMO_SALARY_STRUCTURE;

    try {
      const docRef = doc(db, this.collectionName, this.defaultDocId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return { ...DEMO_SALARY_STRUCTURE, ...snap.data(), id: snap.id } as SalaryStructure;
      } else {
        // Seed default structure into Firestore
        const initialData = cleanFirestoreData({
          ...DEMO_SALARY_STRUCTURE,
          id: this.defaultDocId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await setDoc(docRef, initialData, { merge: true });
        return initialData as SalaryStructure;
      }
    } catch (err: any) {
      console.error('Firestore getSalaryStructure error:', err.message);
      return DEMO_SALARY_STRUCTURE;
    }
  }

  public static async saveSalaryStructure(structure: Partial<SalaryStructure>): Promise<SalaryStructure> {
    if (!isFirebaseConfigured || !db) {
      return { ...DEMO_SALARY_STRUCTURE, ...structure } as SalaryStructure;
    }

    try {
      const docRef = doc(db, this.collectionName, this.defaultDocId);
      const cleanData = cleanFirestoreData({
        ...structure,
        id: this.defaultDocId,
        updatedAt: new Date().toISOString(),
      });

      await setDoc(docRef, cleanData, { merge: true });
      return { ...DEMO_SALARY_STRUCTURE, ...cleanData } as SalaryStructure;
    } catch (err: any) {
      console.error('Firestore saveSalaryStructure error:', err.message);
      throw new Error(err.message || 'Failed to save salary structure to Firestore.');
    }
  }
}
