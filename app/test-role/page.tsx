"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, User, RefreshCw, AlertTriangle } from "lucide-react"
import { RoleGuard } from "@/components/auth/role-guard-safe"

export default function TestRolePage() {
  const { user, role, token } = useAuth()
  const [apiRole, setApiRole] = useState<string | null>(null)
  const [firebaseTest, setFirebaseTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkRoleFromAPI = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/check-role-safe?uid=${user.uid}`)
      const data = await response.json()
      setApiRole(data.role || "error")
    } catch (error) {
      console.error("Error checking role from API:", error)
      setApiRole("error")
    } finally {
      setLoading(false)
    }
  }

  const testFirebaseConnection = async () => {
    try {
      const response = await fetch("/api/admin/test-firebase")
      const data = await response.json()
      setFirebaseTest(data)
    } catch (error) {
      console.error("Error testing Firebase:", error)
      setFirebaseTest({ success: false, error: "Connection failed" })
    }
  }

  const refreshToken = async () => {
    if (!user) return

    try {
      await user.getIdToken(true)
      window.location.reload()
    } catch (error) {
      console.error("Error refreshing token:", error)
    }
  }

  useEffect(() => {
    if (user) {
      checkRoleFromAPI()
      testFirebaseConnection()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>يرجى تسجيل الدخول أولاً</p>
      </div>
    )
  }

  return (
    <RoleGuard>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            اختبار نظام الأدوار
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            اختبار حالة الدور الحالية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">UID:</p>
                <p className="font-mono text-sm">{user.uid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني:</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الاسم:</p>
                <p>{user.displayName || "غير محدد"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                حالة الدور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">الدور من المصادقة:</p>
                <Badge variant={role === "admin" ? "default" : "secondary"}>
                  {role || "غير محدد"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">الدور من API:</p>
                <Badge variant={apiRole === "admin" ? "default" : "secondary"}>
                  {loading ? "جاري التحميل..." : apiRole || "غير محدد"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token:</p>
                <p className="font-mono text-xs break-all">
                  {token ? `${token.substring(0, 50)}...` : "غير متوفر"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                اختبار Firebase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">حالة الاتصال:</p>
                <Badge variant={firebaseTest?.success ? "default" : "destructive"}>
                  {firebaseTest ? (firebaseTest.success ? "متصل" : "خطأ") : "غير محدد"}
                </Badge>
              </div>
              {firebaseTest?.error && (
                <div>
                  <p className="text-sm text-gray-600">خطأ:</p>
                  <p className="text-sm text-red-600">{firebaseTest.error}</p>
                </div>
              )}
              {firebaseTest?.message && (
                <div>
                  <p className="text-sm text-gray-600">رسالة:</p>
                  <p className="text-sm">{firebaseTest.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={checkRoleFromAPI} disabled={loading}>
            <RefreshCw className="w-4 h-4 ml-2" />
            {loading ? "جاري الفحص..." : "فحص الدور من API"}
          </Button>
          <Button variant="outline" onClick={refreshToken}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث Token
          </Button>
          <Button variant="outline" onClick={testFirebaseConnection}>
            اختبار Firebase
          </Button>
        </div>

        {role !== apiRole && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 font-medium mb-2">
                  تحذير: الدور غير متطابق!
                </p>
                <p className="text-sm text-gray-600">
                  الدور من المصادقة ({role}) لا يتطابق مع الدور من API ({apiRole})
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  )
}
