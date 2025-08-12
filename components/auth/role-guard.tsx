"use client"

import type React from "react"

import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "member"
  adminOnly?: boolean
}

export function RoleGuard({ children, requiredRole, adminOnly }: RoleGuardProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth")
        return
      }

      if (adminOnly && role !== "admin") {
        router.push("/dashboard")
        return
      }

      if (requiredRole && role !== requiredRole) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, role, loading, router, requiredRole, adminOnly])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (adminOnly && role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">غير مصرح لك بالوصول</h1>
          <p className="text-gray-600 dark:text-gray-400">هذه الصفحة متاحة للخدام فقط</p>
        </div>
      </div>
    )
  }

  if (requiredRole && role !== requiredRole) {
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
