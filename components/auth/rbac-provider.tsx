"use client"

import { createContext } from "react"

type Role = "admin" | "moderator" | "member" | "guest"

interface Permission {
  action: string
  subject: string
}

interface RBACContextType {
  userRole: Role
  checkPermission: (action: string, subject: string) => boolean
  checkRole: (requiredRole: Role | Role[]) => boolean
  setUserRole: (role: Role) => void
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

// Define permissions for each role
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    // Admin can do everything
    { action: "*", subject: "*" },
  ],
  moderator: [
    // Board management
    { action: "read", subject: "board" },
    { action: "update", subject: "board" },\
