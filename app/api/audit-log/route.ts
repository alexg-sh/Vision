import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit-log';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logData = await req.json();

    if (!logData.action || !logData.entityType || !logData.entityId || !logData.entityName) {
       return NextResponse.json({ message: 'Missing required audit log fields' }, { status: 400 });
    }

    await createAuditLog({
        orgId: logData.orgId,
        boardId: logData.boardId,
        action: logData.action,
        entityType: logData.entityType,
        entityId: logData.entityId,
        entityName: logData.entityName,
        details: logData.details,
    });

    return NextResponse.json({ message: 'Audit log created' }, { status: 201 });

  } catch (error: any) {
    console.error("API Audit Log Error:", error);
    if (error.message === 'User not authenticated for audit logging.' || error.message === 'Missing organization or board context for audit log.') {
         return NextResponse.json({ message: 'Failed to create audit log due to server error.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
