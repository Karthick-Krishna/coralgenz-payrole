import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/server-db';
import { AuditLog } from '@/types';

export async function GET() {
  try {
    const logs = serverDb.getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: true, logs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const log: AuditLog = {
      id: body.id || `audit-${Date.now()}`,
      organizationId: body.organizationId || 'org-coralgenz-01',
      userId: body.userId || 'usr-system',
      userName: body.userName || 'System',
      userRole: body.userRole || 'super_admin',
      action: body.action || 'system_event',
      module: body.module || 'system',
      recordId: body.recordId,
      recordTitle: body.recordTitle,
      details: body.details || '',
      ipAddress: body.ipAddress,
      timestamp: body.timestamp || new Date().toISOString(),
    };

    const saved = serverDb.addAuditLog(log);
    return NextResponse.json({ success: true, log: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving audit log' }, { status: 500 });
  }
}
