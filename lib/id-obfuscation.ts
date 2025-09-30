/**
 * Utility functions for obfuscating member IDs in URLs
 * Uses base64 encoding/decoding to hide real Firebase document IDs
 */

export function obfuscateId(id: string): string {
  try {
    // Encode to base64 and make URL-safe
    const encoded = btoa(id)
    // Replace characters that are not URL-safe
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    console.error('Error obfuscating ID:', error)
    return id // Fallback to original ID
  }
}

export function deobfuscateId(obfuscatedId: string): string {
  try {
    // Restore URL-safe characters
    let encoded = obfuscatedId.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    while (encoded.length % 4 !== 0) {
      encoded += '='
    }
    return atob(encoded)
  } catch (error) {
    console.error('Error deobfuscating ID:', error)
    return obfuscatedId // Fallback to obfuscated ID (might be original)
  }
}

/**
 * Hook to handle member ID obfuscation/deobfuscation
 */
export function useObfuscatedMemberId() {
  const obfuscate = (id: string) => obfuscateId(id)
  const deobfuscate = (obfuscatedId: string) => deobfuscateId(obfuscatedId)

  return { obfuscate, deobfuscate }
}
