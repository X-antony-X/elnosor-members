import { TestRoleRefresh } from "@/components/test-role-debug"

export default function TestRoleDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">اختبار تحديث الدور (نسخة Debug)</h1>
          <TestRoleRefresh />
        </div>
      </div>
    </div>
  )
}
