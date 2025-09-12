// WebAuthn utilities for biometric and hardware key authentication
import { startRegistration, startAuthentication } from "@simplewebauthn/browser"
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/typescript-types"

export interface WebAuthnCredential {
  id: string
  credentialID: string
  publicKey: string
  counter: number
  deviceType: "singleDevice" | "multiDevice"
  backedUp: boolean
  transports?: AuthenticatorTransport[]
  createdAt: Date
  lastUsed: Date
  nickname?: string
}

export interface WebAuthnUser {
  id: string
  username: string
  displayName: string
  credentials: WebAuthnCredential[]
}

export class WebAuthnService {
  private static readonly RP_NAME = "خدمة الشباب"
  private static readonly RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost"
  private static readonly ORIGIN = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  // Check if WebAuthn is supported
  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "navigator" in window &&
      "credentials" in navigator &&
      "create" in navigator.credentials &&
      "get" in navigator.credentials
    )
  }

  // Check if platform authenticator (biometrics) is available
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      console.error("Error checking platform authenticator:", error)
      return false
    }
  }

  // Register a new WebAuthn credential
  static async registerCredential(
    userId: string,
    username: string,
    displayName: string,
    excludeCredentials: string[] = [],
  ): Promise<RegistrationResponseJSON> {
    if (!this.isSupported()) {
      throw new Error("WebAuthn is not supported in this browser")
    }

    try {
      // Get registration options from server
      const optionsResponse = await fetch("/api/webauthn/register/begin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          username,
          displayName,
          excludeCredentials,
        }),
      })

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options")
      }

      const options: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json()

      // Start registration with the browser
      const registrationResponse = await startRegistration(options)

      // Verify registration with server
      const verificationResponse = await fetch("/api/webauthn/register/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          registrationResponse,
        }),
      })

      if (!verificationResponse.ok) {
        throw new Error("Failed to verify registration")
      }

      const verification = await verificationResponse.json()

      if (!verification.verified) {
        throw new Error("Registration verification failed")
      }

      return registrationResponse
    } catch (error) {
      console.error("WebAuthn registration error:", error)
      throw error
    }
  }

  // Authenticate with WebAuthn
  static async authenticate(
    userId?: string,
    allowCredentials?: string[],
  ): Promise<{ success: boolean; user?: any; credential?: AuthenticationResponseJSON }> {
    if (!this.isSupported()) {
      throw new Error("WebAuthn is not supported in this browser")
    }

    try {
      // Get authentication options from server
      const optionsResponse = await fetch("/api/webauthn/authenticate/begin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          allowCredentials,
        }),
      })

      if (!optionsResponse.ok) {
        throw new Error("Failed to get authentication options")
      }

      const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json()

      // Start authentication with the browser
      const authenticationResponse = await startAuthentication(options)

      // Verify authentication with server
      const verificationResponse = await fetch("/api/webauthn/authenticate/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          authenticationResponse,
        }),
      })

      if (!verificationResponse.ok) {
        throw new Error("Failed to verify authentication")
      }

      const verification = await verificationResponse.json()

      if (!verification.verified) {
        throw new Error("Authentication verification failed")
      }

      return {
        success: true,
        user: verification.user,
        credential: authenticationResponse,
      }
    } catch (error) {
      console.error("WebAuthn authentication error:", error)
      throw error
    }
  }

  // Get user's registered credentials
  static async getUserCredentials(userId: string): Promise<WebAuthnCredential[]> {
    try {
      const response = await fetch(`/api/webauthn/credentials/${userId}`)

      if (!response.ok) {
        throw new Error("Failed to get user credentials")
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting user credentials:", error)
      return []
    }
  }

  // Delete a credential
  static async deleteCredential(userId: string, credentialId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/webauthn/credentials/${userId}/${credentialId}`, {
        method: "DELETE",
      })

      return response.ok
    } catch (error) {
      console.error("Error deleting credential:", error)
      return false
    }
  }

  // Update credential nickname
  static async updateCredentialNickname(userId: string, credentialId: string, nickname: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/webauthn/credentials/${userId}/${credentialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      })

      return response.ok
    } catch (error) {
      console.error("Error updating credential nickname:", error)
      return false
    }
  }

  // Get authenticator info
  static getAuthenticatorInfo(credential: AuthenticationResponseJSON): {
    deviceType: string
    transport: string[]
    backupEligible: boolean
    backupState: boolean
  } {
    const response = credential.response
    const clientDataJSON = JSON.parse(atob(response.clientDataJSON))

    return {
      deviceType: "unknown", // Would need to parse authenticatorData for this
      transport: credential.response.transports || [],
      backupEligible: false, // Would need to parse authenticatorData
      backupState: false, // Would need to parse authenticatorData
    }
  }
}

// Helper function to convert ArrayBuffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper function to convert base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
