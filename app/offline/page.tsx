"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { WifiOff, RefreshCw, Home, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = "/"
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4"
            >
              <WifiOff className="w-10 h-10 text-orange-600" />
            </motion.div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">لا يوجد اتصال بالإنترنت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
            </p>

            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full" disabled={!isOnline}>
                <RefreshCw className="w-4 h-4 ml-2" />
                {isOnline ? "إعادة المحاولة" : "جاري التحقق من الاتصال..."}
              </Button>

              <div className="text-sm text-gray-500 dark:text-gray-400">أو تصفح المحتوى المحفوظ:</div>

              <div className="grid grid-cols-1 gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Home className="w-4 h-4 ml-2" />
                    الرئيسية
                  </Button>
                </Link>
                <Link href="/members">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Users className="w-4 h-4 ml-2" />
                    الأعضاء
                  </Button>
                </Link>
                <Link href="/attendance">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Calendar className="w-4 h-4 ml-2" />
                    الحضور
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400">تطبيق خدمة الشباب يعمل بدون اتصال</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
