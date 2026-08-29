import { NextResponse } from 'next/server';
import { AnnouncementService } from '@/lib/firebase/announcement-service';

export async function GET() {
  try {
    const announcements = await AnnouncementService.getAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await AnnouncementService.addAnnouncement(body);
    return NextResponse.json({ success: res, announcement: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save announcement' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Announcement ID is required' }, { status: 400 });
    }
    const res = await AnnouncementService.deleteAnnouncement(id);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete announcement' }, { status: 500 });
  }
}
