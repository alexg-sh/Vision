import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const token = await getToken({ req: new NextRequest(request) }); // Convert Request to NextRequest

  if (!session?.user?.id || !token?.jti) { // jti is often used as the session identifier in JWT strategy
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSessions: Array<{ id: string; sessionToken: string; userId: string; expires: Date }> = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: 'desc' }, // Show most recent first
    });

    // Add metadata (like 'isCurrent') - requires parsing User-Agent or storing more data
    // For now, we identify the current session using the JWT identifier (jti)
    const processedSessions = userSessions.map(s => ({
      id: s.id,
      sessionToken: s.sessionToken, // Needed for deletion
      userId: s.userId,
      expires: s.expires,
      isCurrent: s.sessionToken === token.jti, // Compare with JWT ID
      // Placeholder for device/location info - requires more data stored
      deviceInfo: "Unknown Device", 
      lastActive: s.expires, // Using expires as a proxy for last active time
    }));

    return NextResponse.json(processedSessions, { status: 200 });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    const token = await getToken({ req: new NextRequest(request) });

    if (!session?.user?.id || !token?.jti) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionIdToDelete = searchParams.get('sessionId'); // For deleting a specific session
    const deleteAllOthers = searchParams.get('deleteAllOthers') === 'true'; // For deleting all other sessions

    try {
        if (deleteAllOthers) {
            // Delete all sessions for the user EXCEPT the current one
            const deleteResult = await prisma.session.deleteMany({
                where: {
                    userId: session.user.id,
                    NOT: {
                        sessionToken: token.jti, // Don't delete the current session
                    },
                },
            });
            console.log(`Deleted ${deleteResult.count} other sessions for user ${session.user.id}`);
            return NextResponse.json({ message: 'Signed out from all other sessions successfully' }, { status: 200 });

        } else if (sessionIdToDelete) {
            // Find the specific session to ensure it belongs to the user
            const sessionToDelete = await prisma.session.findUnique({
                where: { id: sessionIdToDelete },
            });

            if (!sessionToDelete || sessionToDelete.userId !== session.user.id) {
                return NextResponse.json({ message: 'Session not found or access denied' }, { status: 404 });
            }

            // Prevent deleting the current session via this specific ID route for safety?
            // if (sessionToDelete.sessionToken === token.jti) {
            //     return NextResponse.json({ message: 'Cannot delete the current active session via this method' }, { status: 400 });
            // }

            await prisma.session.delete({
                where: { id: sessionIdToDelete },
            });
            console.log(`Deleted session ${sessionIdToDelete} for user ${session.user.id}`);
            return NextResponse.json({ message: 'Session signed out successfully' }, { status: 200 });

        } else {
            return NextResponse.json({ message: 'Invalid request parameters' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error deleting session(s): ', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
