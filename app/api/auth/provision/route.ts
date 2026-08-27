import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, role, employeeId, photoURL, phone, gender, createdBy } = body;

    if (!email || !password || !displayName || !role || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create User in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName,
        photoURL,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        // If user exists, fetch them
        userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());
        // Optionally update their password? We'll leave it as is unless update-password is called.
      } else {
        throw authError;
      }
    }

    // 2. Set custom claims for role-based access (optional, but good practice)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Create or update user profile in Firestore `users` collection
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      id: userRecord.uid,
      employeeId,
      email: email.toLowerCase().trim(),
      displayName,
      role,
      photoURL: photoURL || null,
      phone: phone || null,
      gender: gender || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: createdBy || 'Super Admin',
    }, { merge: true });

    // 4. Log the provisioning in `audit_logs`
    await adminDb.collection('audit_logs').add({
      userId: 'system',
      userName: createdBy || 'Super Admin',
      userRole: 'super_admin',
      action: 'provision_user',
      module: 'auth',
      recordId: userRecord.uid,
      recordTitle: displayName,
      details: `Provisioned credentials for ${displayName} (${role})`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    });

  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
