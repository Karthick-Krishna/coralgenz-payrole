import { NextResponse } from 'next/server';
import { DepartmentService } from '@/lib/firebase/department-service';

export async function GET() {
  try {
    const departments = await DepartmentService.getDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.id) {
      await DepartmentService.updateDepartment(body.id, body);
      return NextResponse.json({ success: true, department: body });
    } else {
      const created = await DepartmentService.addDepartment(body);
      return NextResponse.json({ success: true, department: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save department' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
    }
    const res = await DepartmentService.deleteDepartment(id);
    return NextResponse.json({ success: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete department' }, { status: 500 });
  }
}
