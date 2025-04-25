import { getServerSession } from "next-auth/next"; // Use Next Auth's server session
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma as db } from "@/lib/prisma"; // Import prisma as db

// Define the properties required for creating an audit log entry
interface AuditLogProps {
  orgId?: string; // Optional if boardId is provided
  boardId?: string; // Optional if orgId is provided
  action: string; // Changed from AuditAction to string
  entityType: string; // Changed from AuditEntityType to string
  entityId: string;
  entityName: string;
  details?: Record<string, any>; // Optional structured details about the action
}

/**
 * Creates an audit log entry.
 * Fetches the current user session to associate the action with a user.
 * @param props - The properties for the audit log entry.
 */
export const createAuditLog = async (props: AuditLogProps) => {
  const session = await getServerSession(authOptions); // Get current session

  if (!session?.user?.id) {
    console.error("Audit Log Error: User not found in session.");
    throw new Error("User not authenticated for audit logging.");
  }

  const { orgId, boardId, action, entityType, entityId, entityName, details } = props;
  const userId = session.user.id;
  const userName = session.user.name || "Unknown User"; // Handle cases where name might be null

  // Removed the check requiring orgId or boardId, as some logs might be user-specific
  // if (!orgId && !boardId) {
  //    console.error("Audit Log Error: Either orgId or boardId must be provided.");
  //    throw new Error("Missing organization or board context for audit log.");
  // }

  try {
    await db.auditLog.create({
      data: {
        orgId: orgId, // Will be null if not provided
        boardId: boardId, // Will be null if not provided
        userId: userId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        entityName: entityName, // Store entity name/title for easier display
        details: details, // Store optional structured details
      },
    });
  } catch (error) {
    console.error("Audit Log Error: Failed to create audit log entry:", error);
    // Re-throw the error to be handled by the calling API route
    throw new Error("Failed to save audit log to database.");
  }
};
