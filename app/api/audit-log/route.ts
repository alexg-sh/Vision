import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit-log'; // Import the server-only function
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/audit-log
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logData = await req.json();

    // Validate required fields (add more specific validation as needed)
    if (!logData.action || !logData.entityType || !logData.entityId || !logData.entityName) {
       return NextResponse.json({ message: 'Missing required audit log fields' }, { status: 400 });
    }

    // Call the server-only createAuditLog function
    // It will automatically pick up the userId from the session
    await createAuditLog({
        orgId: logData.orgId, // Pass orgId if available
        boardId: logData.boardId, // Pass boardId if available
        action: logData.action,
        entityType: logData.entityType,
        entityId: logData.entityId,
        entityName: logData.entityName,
        details: logData.details,
    });

    return NextResponse.json({ message: 'Audit log created' }, { status: 201 });

  } catch (error: any) {
    console.error("API Audit Log Error:", error);
    // Don't expose detailed errors to the client
    if (error.message === 'User not authenticated for audit logging.' || error.message === 'Missing organization or board context for audit log.') {
         return NextResponse.json({ message: 'Failed to create audit log due to server error.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
