import type { NextRequest } from "next/server"
import { adminAuth } from "./firebase-admin"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string
    role: string
    email?: string
  }
}

export async function verifyAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "No authorization token provided" }
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    return {
      user: {
        uid: decodedToken.uid,
        role: decodedToken.role || "member",
        email: decodedToken.email,
      },
    }
  } catch (error) {
    console.error("Auth verification error:", error)
    return { user: null, error: "Invalid or expired token" }
  }
}

export async function requireAdmin(request: NextRequest) {
  const { user, error } = await verifyAuth(request)

  if (error || !user) {
    return { user: null, error: error || "Authentication required" }
  }

  if (user.role !== "admin") {
    return { user: null, error: "Admin access required" }
  }

  return { user, error: null }
}
