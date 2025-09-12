import { type NextRequest, NextResponse } from "next/server"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { adminDb } from "@/lib/firebase-admin"

const rpID = process.env.NODE_ENV === "production" ? "your-domain.com" : "localhost"

export async function POST(request: NextRequest) {
  try {
    const { userId, allowCredentials = [] } = await request.json()

    let userCredentials: any[] = []

    if (userId) {
      // Get user's registered credentials
      const userDoc = await adminDb.collection("webauthn_users").doc(userId).get()
      if (userDoc.exists) {
        userCredentials = userDoc.data()?.credentials || []
      }
    }

    const allowCredentialDescriptors = [
      ...userCredentials.map((cred: any) => ({
        id: cred.credentialID,
        type: "public-key" as const,
        transports: cred.transports || [],
      })),
      ...allowCredentials.map((id: string) => ({
        id,
        type: "public-key" as const,
      })),
    ]

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      allowCredentials: allowCredentialDescriptors.length > 0 ? allowCredentialDescriptors : undefined,
      userVerification: "preferred",
      rpID,
    })

    // Store challenge temporarily
    const challengeId = userId || `anonymous-${Date.now()}`
    await adminDb
      .collection("webauthn_auth_challenges")
      .doc(challengeId)
      .set({
        challenge: options.challenge,
        userId: userId || null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute
      })

    return NextResponse.json({ ...options, challengeId })
  } catch (error) {
    console.error("WebAuthn authentication begin error:", error)
    return NextResponse.json({ error: "Failed to generate authentication options" }, { status: 500 })
  }
}
