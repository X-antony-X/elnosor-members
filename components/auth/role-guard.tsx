"use client"

import type React from "react"

import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { adminDb } from "@/lib/firebase-admin"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "member"
  adminOnly?: boolean
}

export function RoleGuard({ children, requiredRole, adminOnly }: RoleGuardProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [resolvedRole, setResolvedRole] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    async function resolveRole() {
      if (!user) {
        setResolvedRole(null)
        setResolving(false)
        return
      }

      // If role is already admin or member, use it
      if (role === "admin" || role === "member") {
        setResolvedRole(role)
        setResolving(false)
        return
      }

      // Otherwise, fetch role from Firestore collections
      try {
        // Check role using the admin API endpoint
        const response = await fetch(`/api/admin/check-role?uid=${user.uid}`)
        const data = await response.json()

        if (data.role) {
          setResolvedRole(data.role)
          setResolving(false)
          return
        }

        setResolvedRole("member") // Default fallback
      } catch (error) {
        console.error("Error resolving role:", error)
        setResolvedRole("member") // Default fallback on error
      } finally {
        setResolving(false)
      }
    }

    resolveRole()
  }, [user, role])

  useEffect(() => {
    if (!resolving) {
      if (!user) {
        router.push("/auth")
        return
      }

      if (adminOnly && resolvedRole !== "admin") {
        router.push("/dashboard")
        return
      }

      if (requiredRole && resolvedRole !== requiredRole) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, resolvedRole, resolving, router, requiredRole, adminOnly])

  if (loading || resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (adminOnly && resolvedRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">غير مصرح لك بالوصول</h1>
          <p className="text-gray-600 dark:text-gray-400">هذه الصفحة متاحة للخدام فقط</p>
        </div>
      </div>
    )
  }

  if (requiredRole && resolvedRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">غير مصرح لك بالوصول</h1>
          <p className="text-gray-600 dark:text-gray-400">ليس لديك الصلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
