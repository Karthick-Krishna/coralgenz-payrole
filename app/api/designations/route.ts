import { NextResponse } from 'next/server';
import { DesignationService } from '@/lib/firebase/designation-service';

export async function GET() {
  try {
    const designations = await DesignationService.getDesignations();
    return NextResponse.json({ success: true, designations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.id) {
      await DesignationService.updateDesignation(body.id, body);
      return NextResponse.json({ success: true, designation: body });
    } else {
      const created = await DesignationService.addDesignation(body);
      return NextResponse.json({ success: true, designation: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save designation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Designation ID is required' }, { status: 400 });
    }
    const res = await DesignationService.deleteDesignation(id);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete designation' }, { status: 500 });
  }
}
