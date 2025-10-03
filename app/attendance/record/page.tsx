"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { firestoreHelpers } from "@/hooks/use-firestore"
import toast from "react-hot-toast"

export default function RecordAttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState("")

  useEffect(() => {
    const recordAttendance = async () => {
      const memberId = searchParams.get('memberId')
      const meetingId = searchParams.get('meetingId')

      if (!memberId || !meetingId) {
        setStatus('error')
        setMessage("معلومات غير كاملة. يرجى التأكد من صحة الرابط.")
        return
      }

      try {
        const attendanceData = {
          memberId,
          meetingId,
          checkInTimestamp: new Date(),
          checkInMethod: "qr" as const,
          recordedBy: "external_scan",
        }

        await firestoreHelpers.addAttendanceLog(attendanceData)
        setStatus('success')
        setMessage("تم تسجيل الحضور بنجاح!")
        toast.success("تم تسجيل الحضور بنجاح")

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/attendance')
        }, 3000)

      } catch (error) {
        console.error("Error recording attendance:", error)
        setStatus('error')
        setMessage("خطأ في تسجيل الحضور. يرجى المحاولة مرة أخرى.")
        toast.error("خطأ في تسجيل الحضور")
      }
    }

    recordAttendance()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            تسجيل الحضور
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
          {status === 'success' && (
            <p className="text-sm text-gray-500">سيتم توجيهك إلى صفحة الحضور خلال ثوانٍ...</p>
          )}
          <Button onClick={() => router.push('/attendance')} variant="outline">
            العودة إلى صفحة الحضور
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
