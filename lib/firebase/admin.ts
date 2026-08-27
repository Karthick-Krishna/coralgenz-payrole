import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp: App | undefined;

if (!getApps().length) {
  try {
    let serviceAccount: any = null;

    // 1. Check direct JSON string in Environment Variables (Common on Vercel)
    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_KEY;
    if (envJson) {
      try {
        serviceAccount = typeof envJson === 'string' ? JSON.parse(envJson) : envJson;
      } catch (e) {
        console.warn("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY env string:", e);
      }
    }

    // 2. Check local serviceAccountKey.json file
    if (!serviceAccount) {
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(keyPath)) {
        try {
          const fileContent = fs.readFileSync(keyPath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
        } catch (err) {
          console.warn("Could not parse serviceAccountKey.json:", err);
        }
      }
    }

    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coralgenz-payroll',
      });
      console.log('Firebase Admin initialized successfully using service account JSON.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('Firebase Admin initialized successfully using individual Environment Variables.');
    } else {
      console.warn("Firebase Admin: No credentials found yet (add serviceAccountKey.json or env vars for full Admin privileges).");
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getApps().length > 0 ? getAuth() : ({} as Auth);
export const adminDb = getApps().length > 0 ? getFirestore() : ({} as Firestore);
