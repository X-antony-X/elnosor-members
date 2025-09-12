import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/firebase-admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 })
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken)

    // Set the session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    // Set the cookie in the response
    const response = NextResponse.json({ success: true })

    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    response.cookies.set("__session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Session deletion error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
