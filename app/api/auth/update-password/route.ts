import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword, changedBy, changedByName, employeeId } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 1. Get user by email
    const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());

    // 2. Update password
    await adminAuth.updateUser(userRecord.uid, {
      password: newPassword.trim(),
    });

    // 3. Log audit action
    await adminDb.collection('audit_logs').add({
      userId: changedBy || 'system',
      userName: changedByName || 'Super Admin',
      userRole: 'super_admin',
      action: 'update_password',
      module: 'auth',
      recordId: employeeId || userRecord.uid,
      recordTitle: email,
      details: `Password was updated by ${changedByName || 'Super Admin'} for employee ${email}.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${email} has been updated successfully on the server.`,
    });

  } catch (error: any) {
    console.error('Password update error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found in Firebase Authentication' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
