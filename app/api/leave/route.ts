import { NextResponse } from 'next/server';
import { LeaveService } from '@/lib/firebase/leave-service';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const data = await LeaveService.getLeaves(employeeId);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch leaves' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await LeaveService.submitLeaveRequest(body);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to submit leave' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Leave Request ID is required' }, { status: 400 });
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'leaveRequests', id));
      } catch (err: any) {
        console.error('API Leave deleteDoc error:', err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete leave request' }, { status: 500 });
  }
}
