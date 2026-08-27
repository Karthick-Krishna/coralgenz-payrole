/**
 * Sanitizes any data object or array before passing to Firestore setDoc/updateDoc/addDoc.
 * Firestore strictly forbids `undefined` values in documents.
 */
export function cleanFirestoreData<T = any>(obj: any): T {
  if (obj === undefined) return null as any;
  if (obj === null) return null as any;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestoreData(item)) as any;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}
