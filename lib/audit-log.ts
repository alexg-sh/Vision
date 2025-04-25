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
 * Requires either orgId or boardId to be provided.
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

  if (!orgId && !boardId) {
     console.error("Audit Log Error: Either orgId or boardId must be provided.");
     throw new Error("Missing organization or board context for audit log.");
  }

  try {
    await db.auditLog.create({
      data: {
        orgId: orgId,
        boardId: boardId,
        userId: userId,
        userName: userName, // Store user name for easier display
        action: action,
        entityType: entityType,
        entityId: entityId,
        entityName: entityName, // Store entity name/title for easier display
        details: details, // Store optional structured details
      },
    });
  } catch (error) {
    console.error("Audit Log Error: Failed to create audit log entry:", error);
    // Depending on requirements, you might want to re-throw or handle differently
  }
};
