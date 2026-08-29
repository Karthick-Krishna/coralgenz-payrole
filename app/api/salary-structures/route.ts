import { NextResponse } from 'next/server';
import { SalaryStructureService } from '@/lib/firebase/salary-structure-service';

export async function GET() {
  try {
    const structure = await SalaryStructureService.getSalaryStructure();
    return NextResponse.json({ success: true, salaryStructure: structure });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch salary structure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await SalaryStructureService.saveSalaryStructure(body);
    return NextResponse.json({ success: true, salaryStructure: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save salary structure' }, { status: 500 });
  }
}
