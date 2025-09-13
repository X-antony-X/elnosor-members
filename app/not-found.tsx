"use client"

import { AlertCircle, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card glassy className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">الصفحة غير موجودة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>

          <div className="flex gap-2">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                <Home className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowRight className="w-4 h-4 ml-2" />
              رجوع
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
