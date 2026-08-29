import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/server-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const notifications = serverDb.getNotifications(userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ success: true, notifications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const saved = serverDb.addNotification(body);
    return NextResponse.json({ success: true, notification: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating notification' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || undefined;
    serverDb.markAllNotificationsRead(userId);
    return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating notifications' }, { status: 500 });
  }
}
