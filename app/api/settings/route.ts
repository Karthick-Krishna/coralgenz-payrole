import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/firebase/settings-service';

export async function GET() {
  try {
    const org = await SettingsService.getSettings();
    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await SettingsService.saveSettings(body);
    return NextResponse.json({ success: true, organization: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save settings' }, { status: 500 });
  }
}
