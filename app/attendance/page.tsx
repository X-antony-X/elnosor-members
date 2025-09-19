"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { QrCode, UserCheck, Clock, Calendar, Search, Download, Camera, X, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member, AttendanceLog, Meeting } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { QRScanner } from "@/components/qr-scanner"
import { ExcelService } from "@/lib/excel-utils"
import toast from "react-hot-toast"
import { useMembers, useAttendance, firestoreHelpers } from "@/hooks/use-firestore"
import { useOfflineStorage } from "@/hooks/use-offline-storage"

export default function AttendancePage() {
  const { role } = useAuth()
  const router = useRouter()
  const { members, loading: membersLoading } = useMembers()
  const { attendanceLogs, meetings, loading: attendanceLoading } = useAttendance()
  const { isOffline, addOfflineAttendance, getOfflineMembers, getOfflineAttendance } = useOfflineStorage()
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: "",
    endDate: "",
    reportType: "detailed" as "detailed" | "summary" | "comprehensive",
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (role && role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [role, router])

  const loading = membersLoading || attendanceLoading

  const displayMembers = isOffline ? getOfflineMembers() : members
  const displayAttendanceLogs = isOffline ? getOfflineAttendance() : attendanceLogs

  useEffect(() => {
    if (meetings.length > 0) {
      const today = new Date()
      const todaysMeeting = meetings.find((meeting) => meeting.date.toDateString() === today.toDateString())
      setCurrentMeeting(todaysMeeting || meetings[0])
    }
  }, [meetings])

  const filteredMembers = displayMembers.filter((member) =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleManualCheckIn = async (memberId: string) => {
    try {
      const existingLog = displayAttendanceLogs.find(
        (log) => log.memberId === memberId && log.meetingId === (currentMeeting?.id || "general"),
      )

      if (existingLog) {
        toast.error("العضو مسجل حضوره بالفعل")
        return
      }

      const lateness =
        currentMeeting && currentMeeting.startTime
          ? Math.max(0, Math.floor((new Date().getTime() - currentMeeting.startTime.getTime()) / 60000))
          : 0

      const newLog: AttendanceLog = {
        id: Date.now().toString(),
        memberId,
        meetingId: currentMeeting?.id || "general",
        checkInTimestamp: new Date(),
        checkInMethod: "manual",
        lateness,
      }

      const member = displayMembers.find((m) => m.id === memberId)

      if (isOffline) {
        addOfflineAttendance(newLog)
        toast.success(`تم تسجيل حضور ${member?.fullName} بدون اتصال - سيتم المزامنة عند الاتصال`)
      } else {
        await firestoreHelpers.addAttendanceLog(newLog)
        toast.success(`تم تسجيل حضور ${member?.fullName} بنجاح`)
      }
    } catch (error: any) {
      console.error("Error checking in:", error)
      let errorMessage = "خطأ في تسجيل الحضور"
      if (error?.code === 'permission-denied') {
        errorMessage = "ليس لديك صلاحية لتسجيل الحضور"
      } else if (error?.code === 'unavailable') {
        errorMessage = "خدمة قاعدة البيانات غير متاحة حالياً"
      } else if (error?.code === 'deadline-exceeded') {
        errorMessage = "انتهت مهلة الطلب، جرب مرة أخرى"
      }
      toast.error(errorMessage)
    }
  }

  const handleQRScan = async (qrData: string) => {
    try {
      setScannerLoading(true)
      const data = JSON.parse(qrData)

      if (!data.memberId) {
        toast.error("كود QR غير صالح أو منتهي الصلاحية")
        return
      }

      const existingLog = displayAttendanceLogs.find(
        (log) => log.memberId === data.memberId && log.meetingId === (currentMeeting?.id || "general"),
      )

      if (existingLog) {
        toast.error("العضو مسجل حضوره بالفعل")
        return
      }

      const member = displayMembers.find((m) => m.id === data.memberId)
      if (!member) {
        toast.error("عضو غير موجود")
        return
      }

      // Get current time from server or local time
      const now = new Date()

      const lateness = currentMeeting && currentMeeting.startTime
        ? Math.max(0, Math.floor((now.getTime() - currentMeeting.startTime.getTime()) / 60000))
        : 0

      const newLog: AttendanceLog = {
        id: Date.now().toString(),
        memberId: data.memberId,
        meetingId: currentMeeting?.id || "general",
        checkInTimestamp: now,
        checkInMethod: "qr",
        lateness,
      }

      if (isOffline) {
        addOfflineAttendance(newLog)
        toast.success(`تم تسجيل حضور ${member.fullName} بدون اتصال - سيتم المزامنة عند الاتصال`)
      } else {
        await firestoreHelpers.addAttendanceLog(newLog)
        toast.success(`تم تسجيل حضور ${member.fullName} بنجاح`)
      }

      setShowQRScanner(false)
    } catch (error: any) {
      console.error("Error processing QR scan:", error)
      let errorMessage = "خطأ في قراءة كود QR"
      if (error?.code === 'permission-denied') {
        errorMessage = "ليس لديك صلاحية لتسجيل الحضور"
      } else if (error?.code === 'unavailable') {
        errorMessage = "خدمة قاعدة البيانات غير متاحة حالياً"
      } else if (error?.code === 'deadline-exceeded') {
        errorMessage = "انتهت مهلة الطلب، جرب مرة أخرى"
      }
      toast.error(errorMessage)
    } finally {
      setScannerLoading(false)
    }
  }

  const handleCheckOut = async (logId: string) => {
    try {
      if (isOffline) {
        toast.error("تسجيل الخروج غير متاح بدون اتصال")
        return
      }

      await firestoreHelpers.updateAttendanceLog(logId, {
        checkOutTimestamp: new Date(),
      })
      toast.success("تم تسجيل الخروج بنجاح")
    } catch (error: any) {
      console.error("Error checking out:", error)
      let errorMessage = "خطأ في تسجيل الخروج"
      if (error?.code === 'permission-denied') {
        errorMessage = "ليس لديك صلاحية لتسجيل الخروج"
      } else if (error?.code === 'unavailable') {
        errorMessage = "خدمة قاعدة البيانات غير متاحة حالياً"
      } else if (error?.code === 'deadline-exceeded') {
        errorMessage = "انتهت مهلة الطلب، جرب مرة أخرى"
      }
      toast.error(errorMessage)
    }
  }

  const generateMemberQR = (memberId: string) => {
    return JSON.stringify({
      memberId,
    })
  }

  const handleExportAttendance = () => {
    try {
      const { startDate, endDate, reportType } = exportDateRange

      let filteredLogs = displayAttendanceLogs
      if (startDate || endDate) {
        filteredLogs = displayAttendanceLogs.filter((log) => {
          const logDate = log.checkInTimestamp
          if (startDate && logDate < new Date(startDate)) return false
          if (endDate && logDate > new Date(endDate)) return false
          return true
        })
      }

      switch (reportType) {
        case "detailed":
          ExcelService.exportAttendance(filteredLogs, displayMembers, meetings)
          break
        case "comprehensive":
          ExcelService.exportAttendanceReport(
            filteredLogs,
            displayMembers,
            meetings,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
          )
          break
        default:
          ExcelService.exportAttendance(filteredLogs, displayMembers, meetings)
      }

      toast.success("تم تصدير تقرير الحضور بنجاح")
      setExportDialogOpen(false)
    } catch (error) {
      toast.error("خطأ في تصدير التقرير")
    }
  }

  const formatLateness = (minutes: number) => {
    if (minutes <= 0) return t("onTime")
    if (minutes < 60) return `${t("lateBy")} ${minutes} ${t("minutes")}`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${t("lateBy")} ${hours} ${t("hours")} ${remainingMinutes} ${t("minutes")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("attendance")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة حضور الأعضاء
            {isOffline && <span className="text-orange-600 mr-2">(وضع عدم الاتصال)</span>}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setShowQRScanner(true)} className="bg-green-600 hover:bg-green-700">
            <Camera className="w-4 h-4 ml-2" />
            مسح QR
          </Button>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="w-4 h-4 ml-2" />
              تصدير تقرير
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تصدير تقرير الحضور</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نوع التقرير</Label>
                  <Select
                    value={exportDateRange.reportType}
                    onValueChange={(value: any) => setExportDateRange({ ...exportDateRange, reportType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">تفصيلي</SelectItem>
                      <SelectItem value="comprehensive">شامل مع الإحصائيات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={exportDateRange.startDate}
                      onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={exportDateRange.endDate}
                      onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleExportAttendance}>
                    <FileSpreadsheet className="w-4 h-4 ml-2" />
                    تصدير
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {currentMeeting && (
            <Card glassy className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">{currentMeeting.title}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {currentMeeting.startTime.toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {currentMeeting.endTime.toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="check-in" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="check-in">{t("checkIn")}</TabsTrigger>
          <TabsTrigger value="qr-scanner">مسح QR</TabsTrigger>
          <TabsTrigger value="qr-codes">أكواد QR</TabsTrigger>
          <TabsTrigger value="logs">{t("attendanceLog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="check-in" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  {t("manualAttendance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t("search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMembers.map((member) => {
                    const hasCheckedIn = displayAttendanceLogs.some(
                      (log) => log.memberId === member.id && log.meetingId === (currentMeeting?.id || "general"),
                    )
                    const attendanceLog = displayAttendanceLogs.find(
                      (log) => log.memberId === member.id && log.meetingId === (currentMeeting?.id || "general"),
                    )

                    return (
                      <Card glassy key={member.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={hasCheckedIn}
                                disabled={hasCheckedIn}
                                onCheckedChange={(checked) => {
                                  if (checked) handleManualCheckIn(member.id!)
                                }}
                              />
                              <h3 className="font-medium">{member.fullName}</h3>
                            </div>
                            {hasCheckedIn && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                حاضر
                              </Badge>
                            )}
                          </div>

                          {hasCheckedIn && attendanceLog ? (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-3 h-3 inline ml-1" />
                                {attendanceLog.checkInTimestamp.toLocaleTimeString("ar-EG", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-sm">
                                <Badge variant={attendanceLog.lateness! > 0 ? "destructive" : "secondary"}>
                                  {formatLateness(attendanceLog.lateness || 0)}
                                </Badge>
                              </p>
                              {!attendanceLog.checkOutTimestamp && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCheckOut(attendanceLog.id!)}
                                  className="w-full"
                                >
                                  {t("checkOut")}
                                </Button>
                              )}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="qr-scanner" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  مسح كود QR للحضور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button onClick={() => setShowQRScanner(true)} size="lg" className="bg-green-600 hover:bg-green-700">
                    <Camera className="w-5 h-5 ml-2" />
                    فتح الكاميرا لمسح QR
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    اضغط لفتح الكاميرا ومسح كود QR الخاص بالعضو
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="qr-codes" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  أكواد QR للأعضاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <Card glassy key={member.id} className="text-center">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-4">{member.fullName}</h3>
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <QRCode value={generateMemberQR(member.id!)} size={120} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">امسح للتسجيل</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t("attendanceLog")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{displayAttendanceLogs.length} سجل</Badge>
                    <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                      <Download className="w-4 h-4 ml-2" />
                      تصدير تقرير
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayAttendanceLogs.map((log) => {
                    const member = displayMembers.find((m) => m.id === log.memberId)
                    if (!member) return null

                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{member.fullName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {log.checkInTimestamp.toLocaleString("ar-EG")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge variant={log.lateness! > 0 ? "destructive" : "secondary"}>
                            {formatLateness(log.lateness || 0)}
                          </Badge>
                          <Badge variant="outline">{log.checkInMethod === "qr" ? "QR" : "يدوي"}</Badge>
                          {log.checkOutTimestamp && (
                            <Badge variant="secondary">خروج: {log.checkOutTimestamp.toLocaleTimeString("ar-EG")}</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {displayAttendanceLogs.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">لا توجد سجلات حضور لهذا الاجتماع</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              مسح كود QR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {scannerLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mr-2">جاري معالجة الكود...</p>
              </div>
            ) : (
              <QRScanner
                onScan={handleQRScan}
                onError={(error) => {
                  console.error("QR Scanner error:", error)
                  toast.error(error)
                }}
              />
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">وجه الكاميرا نحو كود QR الخاص بالعضو</p>
              <Button variant="outline" onClick={() => setShowQRScanner(false)} className="mt-2">
                <X className="w-4 h-4 ml-2" />
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
