import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { adminDb } from "@/lib/firebase-admin"

const rpID = process.env.NODE_ENV === "production" ? "your-domain.com" : "localhost"
const origin = process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const { userId, authenticationResponse, challengeId } = await request.json()

    if (!authenticationResponse) {
      return NextResponse.json({ error: "Missing authentication response" }, { status: 400 })
    }

    const lookupId = challengeId || userId
    if (!lookupId) {
      return NextResponse.json({ error: "Missing challenge identifier" }, { status: 400 })
    }

    // Get stored challenge
    const challengeDoc = await adminDb.collection("webauthn_auth_challenges").doc(lookupId).get()

    if (!challengeDoc.exists) {
      return NextResponse.json({ error: "Challenge not found or expired" }, { status: 400 })
    }

    const { challenge, expiresAt, userId: storedUserId } = challengeDoc.data()!

    if (new Date() > expiresAt.toDate()) {
      await adminDb.collection("webauthn_auth_challenges").doc(lookupId).delete()
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 })
    }

    // Find the credential used for authentication
    const credentialID = authenticationResponse.id
    let authenticator: any = null
    let credentialOwner: string | null = null

    if (storedUserId) {
      // Look up specific user's credentials
      const userDoc = await adminDb.collection("webauthn_users").doc(storedUserId).get()
      if (userDoc.exists) {
        const credentials = userDoc.data()?.credentials || []
        authenticator = credentials.find((cred: any) => cred.credentialID === credentialID)
        if (authenticator) {
          credentialOwner = storedUserId
        }
      }
    } else {
      // Search all users for this credential (for usernameless authentication)
      const usersQuery = await adminDb.collection("webauthn_users").get()

      for (const userDoc of usersQuery.docs) {
        const credentials = userDoc.data().credentials || []
        const foundCred = credentials.find((cred: any) => cred.credentialID === credentialID)
        if (foundCred) {
          authenticator = foundCred
          credentialOwner = userDoc.id
          break
        }
      }
    }

    if (!authenticator || !credentialOwner) {
      return NextResponse.json({ error: "Credential not found" }, { status: 400 })
    }

    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, "base64"),
        credentialPublicKey: Buffer.from(authenticator.publicKey, "base64"),
        counter: authenticator.counter,
        transports: authenticator.transports,
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: "Authentication verification failed" }, { status: 400 })
    }

    // Update credential counter and last used
    const userRef = adminDb.collection("webauthn_users").doc(credentialOwner)
    const userDoc = await userRef.get()

    if (userDoc.exists) {
      const credentials = userDoc.data()?.credentials || []
      const updatedCredentials = credentials.map((cred: any) =>
        cred.credentialID === credentialID
          ? { ...cred, counter: verification.authenticationInfo.newCounter, lastUsed: new Date() }
          : cred,
      )

      await userRef.update({
        credentials: updatedCredentials,
        lastAuthenticated: new Date(),
      })
    }

    // Get user profile from Firebase Auth
    const userProfile = await adminDb.collection("users").doc(credentialOwner).get()

    // Clean up challenge
    await adminDb.collection("webauthn_auth_challenges").doc(lookupId).delete()

    return NextResponse.json({
      verified: true,
      user: {
        id: credentialOwner,
        ...userProfile.data(),
      },
      authenticator: {
        credentialID: authenticator.credentialID,
        counter: verification.authenticationInfo.newCounter,
        deviceType: authenticator.deviceType,
      },
    })
  } catch (error) {
    console.error("WebAuthn authentication finish error:", error)
    return NextResponse.json({ error: "Failed to verify authentication" }, { status: 500 })
  }
}
