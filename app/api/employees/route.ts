import { NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/firebase/employee-service';

export async function GET() {
  try {
    const employees = await EmployeeService.getEmployees();
    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch employees from server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employee = await EmployeeService.addEmployee(body, {
      portalPassword: body.portalPassword,
      portalRole: body.portalRole || body.role,
      createdBy: body.changedBy || body.createdBy,
      creatorRole: body.creatorRole,
    });
    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create employee on server' },
      { status: 500 }
    );
  }
}
