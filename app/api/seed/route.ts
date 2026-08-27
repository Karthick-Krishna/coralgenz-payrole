import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { DEMO_EMPLOYEES, DEMO_USERS } from '@/lib/demo/demo-data';

export async function GET() {
  try {
    const employeesCol = adminDb.collection('employees');
    const usersCol = adminDb.collection('users');

    // 1. Seed Employees
    let seededEmployeesCount = 0;
    for (const emp of DEMO_EMPLOYEES) {
      await employeesCol.doc(emp.id).set(emp, { merge: true });
      seededEmployeesCount++;
    }

    // 2. Seed Users
    let seededUsersCount = 0;
    for (const user of DEMO_USERS) {
      await usersCol.doc(user.id).set(user, { merge: true });
      seededUsersCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seededEmployeesCount} employees and ${seededUsersCount} users to Firestore.`,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}
