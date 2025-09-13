"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console and external service
    console.error("Page error:", error)

    // Optional: Send to logging service
    const errorData = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    console.error("Error logged:", errorData)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card glassy className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">خطأ في الخادم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            حدث خطأ في الخادم. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
          </p>

          {error.digest && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              رقم الخطأ: {error.digest}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              <Home className="w-4 h-4 ml-2" />
              الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
