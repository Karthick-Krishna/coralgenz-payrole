import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { User, UserRole } from '@/types';
import { cleanFirestoreData } from './sanitize';

export class UserService {
  private static collectionName = 'users';

  public static async getUsers(): Promise<User[]> {
    if (!isFirebaseConfigured || !db) return [];
    
    try {
      const q = query(collection(db, this.collectionName));
      const snap = await getDocs(q);
      const list: User[] = [];
      snap.forEach(d => list.push({ ...d.data(), id: d.id } as User));
      return list;
    } catch (e) {
      console.warn('Firestore getUsers error:', e);
      return [];
    }
  }

  public static async updateUserRole(userId: string, role: UserRole): Promise<boolean> {
    if (!userId || !isFirebaseConfigured || !db) return false;

    try {
      await updateDoc(doc(db, this.collectionName, userId), { role });
      return true;
    } catch (e) {
      console.warn('Firestore updateUserRole error:', e);
      return false;
    }
  }

  public static async deleteUser(userId: string): Promise<boolean> {
    if (!userId || !isFirebaseConfigured || !db) return false;

    try {
      await deleteDoc(doc(db, this.collectionName, userId));
      return true;
    } catch (e) {
      console.warn('Firestore deleteUser error:', e);
      return false;
    }
  }
}
