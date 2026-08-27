import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp: App | undefined;

if (!getApps().length) {
  try {
    const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
    let serviceAccount: any = null;

    if (fs.existsSync(keyPath)) {
      try {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
      } catch (err) {
        console.warn("Could not parse serviceAccountKey.json:", err);
      }
    }

    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully using serviceAccountKey.json.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully using Environment Variables.');
    } else {
      console.warn("Firebase Admin: No credentials found yet (add serviceAccountKey.json or env vars).");
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getApps().length > 0 ? getAuth() : ({} as Auth);
export const adminDb = getApps().length > 0 ? getFirestore() : ({} as Firestore);
