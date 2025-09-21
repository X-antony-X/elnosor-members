"use client"

import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"

export function TestRoleRefresh() {
  const { user, role, refreshRole, loading } = useAuth()

  console.log("🔄 [COMPONENT] Rendering test component, loading:", loading, "role:", role);

  if (loading) {
    console.log("⏳ [COMPONENT] Still loading...");
    return <div>جاري التحميل...</div>
  }

  if (!user) {
    console.log("⚠️ [COMPONENT] No user found");
    return <div>يرجى تسجيل الدخول أولاً</div>
  }

  console.log("✅ [COMPONENT] User found:", user.uid, "role:", role);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-md">
      <h3 className="text-xl font-semibold mb-2">اختبار تحديث الدور (نسخة Debug)</h3>
      <p className="text-sm text-gray-600 mb-4">
        اختبار وظيفة تحديث الدور بعد تغيير الدور في قاعدة البيانات
      </p>

      <div className="space-y-2 mb-4">
        <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
        <p><strong>الدور الحالي:</strong> {role === "admin" ? "مدير" : "عضو"}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      <Button
        onClick={async () => {
          console.log("🔄 [COMPONENT] Refresh button clicked");
          await refreshRole();
          console.log("✅ [COMPONENT] Refresh completed");
        }}
        className="w-full"
      >
        تحديث الدور
      </Button>

      <p className="text-sm text-gray-600 mt-2">
        اضغط على الزر أعلاه لتحديث الدور من قاعدة البيانات
      </p>

      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p className="font-semibold">Debug Info:</p>
        <p>افتح Developer Tools (F12) لرؤية تفاصيل العملية</p>
      </div>
    </div>
  )
}
