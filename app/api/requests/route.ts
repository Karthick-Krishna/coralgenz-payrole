import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import { FirestoreRest } from '@/lib/firebase/firestore-rest';
import { RequestService } from '@/lib/firebase/request-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const requests = await RequestService.getRequests(employeeId);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await RequestService.submitRequest(body);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to submit request' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    let deleted = false;

    // 1. Admin SDK deletion
    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('requests').doc(id).delete();
        deleted = true;
      } catch (adminErr: any) {
        console.warn('Admin Firestore deleteRequest error:', adminErr.message);
      }
    }

    // 2. Google Cloud Firestore REST API deletion
    if (!deleted) {
      try {
        const restDeleted = await FirestoreRest.deleteDocument('requests', id);
        if (restDeleted) deleted = true;
      } catch (restErr: any) {
        console.warn('REST deleteRequest warning:', restErr.message);
      }
    }

    // 3. Client Firestore Fallback
    if (!deleted && db) {
      try {
        await deleteDoc(doc(db, 'requests', id));
        deleted = true;
      } catch (clientErr: any) {
        console.error('Client Firestore deleteRequest error:', clientErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete request' }, { status: 500 });
  }
}
