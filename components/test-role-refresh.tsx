"use client"

import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"

export function TestRoleRefresh() {
  const { user, role, refreshRole, loading } = useAuth()

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  if (!user) {
    return <div>يرجى تسجيل الدخول أولاً</div>
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-md">
      <h3 className="text-xl font-semibold mb-2">اختبار تحديث الدور</h3>
      <p className="text-sm text-gray-600 mb-4">
        اختبار وظيفة تحديث الدور بعد تغيير الدور في قاعدة البيانات
      </p>

      <div className="space-y-2 mb-4">
        <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
        <p><strong>الدور الحالي:</strong> {role === "admin" ? "خادم" : "مخدم"}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      <Button
        onClick={refreshRole}
        className="w-full"
      >
        تحديث الدور
      </Button>

      <p className="text-sm text-gray-600 mt-2">
        اضغط على الزر أعلاه لتحديث الدور من قاعدة البيانات
      </p>
    </div>
  )
}
