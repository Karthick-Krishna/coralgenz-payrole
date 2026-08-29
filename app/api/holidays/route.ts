import { NextResponse } from 'next/server';
import { HolidayService } from '@/lib/firebase/holiday-service';

export async function GET() {
  try {
    const holidays = await HolidayService.getHolidays();
    return NextResponse.json({ success: true, holidays });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.id) {
      await HolidayService.updateHoliday(body.id, body);
      return NextResponse.json({ success: true, holiday: body });
    } else {
      const created = await HolidayService.addHoliday(body);
      return NextResponse.json({ success: true, holiday: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save holiday' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Holiday ID is required' }, { status: 400 });
    }
    const res = await HolidayService.deleteHoliday(id);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete holiday' }, { status: 500 });
  }
}
