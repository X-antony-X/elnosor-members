import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function calculateLateness(checkIn: Date, meetingStart: Date): number {
  const diff = checkIn.getTime() - meetingStart.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60))) // in minutes
}

export function formatLateness(minutes: number): string {
  if (minutes === 0) return "في الوقت"

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `متأخر ${hours} ساعة${remainingMinutes > 0 ? ` و ${remainingMinutes} دقيقة` : ""}`
  }

  return `متأخر ${remainingMinutes} دقيقة`
}

export function generateMemberQR(memberId: string): string {
  // In production, this should include a secure signature
  const timestamp = Date.now()
  const signature = btoa(`${memberId}:${timestamp}`)
  return `church-youth://member/${memberId}?sig=${signature}`
}

export function validateQRSignature(qrData: string): { valid: boolean; memberId?: string } {
  try {
    const url = new URL(qrData)
    const memberId = url.pathname.split("/").pop()
    const signature = url.searchParams.get("sig")

    if (!memberId || !signature) {
      return { valid: false }
    }

    // In production, verify the signature properly
    return { valid: true, memberId }
  } catch {
    return { valid: false }
  }
}
