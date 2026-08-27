import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { db, firebaseConfig } from '@/lib/firebase/config';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/firebase/sanitize';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      displayName,
      role = 'employee',
      employeeId,
      photoURL,
      phone,
      gender,
      createdBy = 'Super Admin',
    } = body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || 'Welcome@2026').trim();

    if (!cleanEmail || !displayName || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, displayName, or employeeId.' },
        { status: 400 }
      );
    }

    let uid = '';
    let firebaseCreated = false;

    // --- STEP 1: CREATE USER IN FIREBASE AUTHENTICATION ---

    // A. Attempt via Firebase Admin SDK if available
    if (adminAuth && typeof adminAuth.createUser === 'function') {
      try {
        const userRecord = await adminAuth.createUser({
          email: cleanEmail,
          password: cleanPassword,
          displayName,
          photoURL: photoURL || undefined,
        });
        uid = userRecord.uid;
        firebaseCreated = true;

        try {
          await adminAuth.setCustomUserClaims(uid, { role, employeeId });
        } catch {
          // Custom claims optional
        }
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/email-already-in-use') {
          const existingUser = await adminAuth.getUserByEmail(cleanEmail);
          uid = existingUser.uid;
          firebaseCreated = true;
          // Update password if specified
          if (cleanPassword) {
            try {
              await adminAuth.updateUser(uid, { password: cleanPassword });
            } catch {
              // Non-fatal
            }
          }
        } else {
          console.warn('Firebase Admin createUser warning, attempting REST fallback:', authError.message);
        }
      }
    }

    // B. Fallback to Firebase Auth REST API (Works directly using Web API Key without service account!)
    if (!uid && firebaseConfig.apiKey) {
      try {
        const restUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
        const restRes = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
            returnSecureToken: true,
          }),
        });

        const restData = await restRes.json();

        if (restRes.ok && restData.localId) {
          uid = restData.localId;
          firebaseCreated = true;
        } else if (restData?.error?.message === 'EMAIL_EXISTS') {
          firebaseCreated = true;
          uid = `usr-${employeeId.toLowerCase()}`;
        } else {
          console.warn('Firebase Auth REST signup response:', restData);
          uid = `usr-${employeeId.toLowerCase()}`;
        }
      } catch (restErr: any) {
        console.warn('Firebase Auth REST signup exception:', restErr.message);
        uid = `usr-${employeeId.toLowerCase()}`;
      }
    }

    if (!uid) {
      uid = `usr-${employeeId.toLowerCase()}`;
    }

    // --- STEP 2: WRITE USER PROFILE TO FIRESTORE (users collection) ---
    const userPayload = cleanFirestoreData({
      id: uid,
      employeeId,
      email: cleanEmail,
      displayName,
      role,
      photoURL: photoURL || null,
      phone: phone || null,
      gender: gender || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
    });

    // A. Via Admin Firestore if available
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('users').doc(uid).set(userPayload, { merge: true });
      } catch (dbErr: any) {
        console.warn('Admin Firestore users doc set warning:', dbErr.message);
      }
    }

    // B. Via Client Firestore SDK
    if (db) {
      try {
        await setDoc(doc(db!, 'users', uid), userPayload, { merge: true });
      } catch (clientDbErr: any) {
        console.warn('Client Firestore users doc set notice:', clientDbErr.message);
      }
    }

    // --- STEP 3: CREATE DEFAULT LEAVE BALANCE IN FIRESTORE ---
    const leaveBalPayload = cleanFirestoreData({
      id: `lb-${employeeId}-2026`,
      organizationId: 'org-coralgenz-01',
      employeeId,
      year: 2026,
      casual: { allocated: 12, used: 0, remaining: 12 },
      sick: { allocated: 10, used: 0, remaining: 10 },
      annual: { allocated: 15, used: 0, remaining: 15 },
      earned: { allocated: 10, used: 0, remaining: 10 },
      unpaid: { used: 0 },
      updatedAt: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('leaveBalances').doc(leaveBalPayload.id).set(leaveBalPayload, { merge: true });
      } catch {}
    }
    if (db) {
      try {
        await setDoc(doc(db!, 'leaveBalances', leaveBalPayload.id), leaveBalPayload, { merge: true });
      } catch {}
    }

    // --- STEP 4: RECORD AUDIT LOG IN FIRESTORE ---
    const auditPayload = cleanFirestoreData({
      userId: 'system',
      userName: createdBy,
      userRole: 'super_admin',
      action: 'provision_user',
      module: 'auth',
      recordId: employeeId,
      recordTitle: `${displayName} (${cleanEmail})`,
      details: `Provisioned credentials for ${displayName} as ${role}. Official login ID: ${cleanEmail}`,
      timestamp: new Date().toISOString(),
    });

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('audit_logs').add(auditPayload);
      } catch {}
    }
    if (db) {
      try {
        await addDoc(collection(db!, 'audit_logs'), auditPayload);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      uid,
      email: cleanEmail,
      firebaseCreated,
      message: `Account credentials provisioned for ${cleanEmail} on server.`,
    });
  } catch (error: any) {
    console.error('User provisioning server error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during user provisioning' },
      { status: 500 }
    );
  }
}
