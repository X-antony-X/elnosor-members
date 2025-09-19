import { type NextRequest, NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { adminDb } from "@/lib/firebase-admin"

const rpID = process.env.NODE_ENV === "production" ? process.env.VERCEL_URL || "localhost" : "localhost"
const origin = process.env.NODE_ENV === "production" ? process.env.VERCEL_URL_FULL || "https://example.com" : "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const { userId, registrationResponse } = await request.json()

    if (!userId || !registrationResponse) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get stored challenge
    const challengeDoc = await adminDb.collection("webauthn_challenges").doc(userId).get()

    if (!challengeDoc.exists) {
      return NextResponse.json({ error: "Challenge not found or expired" }, { status: 400 })
    }

    const { challenge, expiresAt } = challengeDoc.data()!

    if (new Date() > expiresAt.toDate()) {
      await adminDb.collection("webauthn_challenges").doc(userId).delete()
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 })
    }

    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Registration verification failed" }, { status: 400 })
    }

    const {
      credential: { id, publicKey, counter },
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo

    // Save the credential
    const credential = {
      credentialID: Buffer.from(id).toString("base64"),
      publicKey: Buffer.from(publicKey).toString("base64"),
      counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: registrationResponse.response.transports || [],
      createdAt: new Date(),
      lastUsed: new Date(),
      nickname: `${credentialDeviceType === "multiDevice" ? "Security Key" : "Biometric"} - ${new Date().toLocaleDateString("ar-EG")}`,
    }

    // Update user's credentials
    const userRef = adminDb.collection("webauthn_users").doc(userId)
    const userDoc = await userRef.get()

    if (userDoc.exists) {
      await userRef.update({
        credentials: [...(userDoc.data()?.credentials || []), credential],
        updatedAt: new Date(),
      })
    } else {
      await userRef.set({
        id: userId,
        credentials: [credential],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Clean up challenge
    await adminDb.collection("webauthn_challenges").doc(userId).delete()

    return NextResponse.json({
      verified: true,
      credential: {
        id: Buffer.from(id).toString("base64"),
        type: credentialDeviceType,
        nickname: credential.nickname,
      },
    })
  } catch (error) {
    console.error("WebAuthn registration finish error:", error)
    return NextResponse.json({ error: "Failed to verify registration" }, { status: 500 })
  }
}
