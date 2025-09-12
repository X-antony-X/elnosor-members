import { type NextRequest, NextResponse } from "next/server"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import { adminDb } from "@/lib/firebase-admin"

const rpName = "خدمة الشباب"
const rpID = process.env.NODE_ENV === "production" ? "your-domain.com" : "localhost"
const origin = process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, displayName, excludeCredentials = [] } = await request.json()

    if (!userId || !username || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's existing credentials to exclude them
    const userDoc = await adminDb.collection("webauthn_users").doc(userId).get()
    const existingCredentials = userDoc.exists ? userDoc.data()?.credentials || [] : []

    const excludeCredentialDescriptors = [
      ...existingCredentials.map((cred: any) => ({
        id: cred.credentialID,
        type: "public-key" as const,
        transports: cred.transports || [],
      })),
      ...excludeCredentials.map((id: string) => ({
        id,
        type: "public-key" as const,
      })),
    ]

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: username,
      userDisplayName: displayName,
      timeout: 60000,
      attestationType: "none",
      excludeCredentials: excludeCredentialDescriptors,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // Prefer platform authenticators (biometrics)
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    })

    // Store challenge temporarily (in production, use Redis or similar)
    await adminDb
      .collection("webauthn_challenges")
      .doc(userId)
      .set({
        challenge: options.challenge,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute
      })

    return NextResponse.json(options)
  } catch (error) {
    console.error("WebAuthn registration begin error:", error)
    return NextResponse.json({ error: "Failed to generate registration options" }, { status: 500 })
  }
}
