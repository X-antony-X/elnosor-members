"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { UserCheck, Search, Download, Camera, X, FileSpreadsheet, Crown, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member, AttendanceLog, Meeting } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { Html5QrcodeScanner } from 'html5-qrcode'
import { NumberScanner } from "@/components/number-scanner"
import { ExcelService } from "@/lib/excel-utils"
import toast from "react-hot-toast"
import { useMembers, useAttendance, firestoreHelpers } from "@/hooks/use-firestore"
import { useOfflineStorage } from "@/hooks/use-offline-storage"
import { validateQRSignature } from "@/lib/utils"
import * as QRCode from "qrcode.react"

export default function AttendancePage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const { members, loading: membersLoading } = useMembers()
  const { attendanceLogs, meetings, loading: attendanceLoading } = useAttendance()
  const { isOffline, addOfflineAttendance, getOfflineMembers, getOfflineAttendance } = useOfflineStorage()
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const html5QrcodeScannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: "",
    endDate: "",
    reportType: "detailed" as "detailed" | "summary" | "comprehensive",
  })
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [storagePermission, setStoragePermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const scannerRef = useRef<HTMLDivElement>(null)
  const [manualCode, setManualCode] = useState("")
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [showNumberScanner, setShowNumberScanner] = useState(false)
  const [startNumberScanner, setStartNumberScanner] = useState(false)
  const [numberScannerLoading, setNumberScannerLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    // Check if running over HTTPS (required for camera access)
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost'

    if (!isHttps) {
      setCameraPermission('denied')
      setStoragePermission('denied')
      setNotificationPermission('denied')
      console.warn('Camera access requires HTTPS. Please run the app over HTTPS for camera functionality.')
      return
    }

    // Permission request functions
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraPermission('granted')
        stream.getTracks().forEach(track => track.stop())
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          setCameraPermission('denied')
          toast.error('تم رفض إذن الكاميرا')
        } else {
          setCameraPermission('prompt')
          toast.error('يرجى السماح بإذن الكاميرا')
        }
      }
    }

    const requestStoragePermission = async () => {
      try {
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persisted()
          if (!isPersisted) {
            const persisted = await navigator.storage.persist()
            setStoragePermission(persisted ? 'granted' : 'denied')
            if (!persisted) {
              toast.error('تم رفض إذن التخزين الدائم')
            }
          } else {
            setStoragePermission('granted')
          }
        } else {
          setStoragePermission('prompt')
          toast.error('إذن التخزين غير مدعوم في هذا المتصفح')
        }
      } catch (error) {
        setStoragePermission('denied')
        toast.error('خطأ في طلب إذن التخزين')
      }
    }

    const requestNotificationPermission = async () => {
      try {
        if ('Notification' in window) {
          const permission = Notification.permission
          setNotificationPermission(permission as 'granted' | 'denied' | 'prompt')
          if (permission === 'default') {
            const newPermission = await Notification.requestPermission()
            setNotificationPermission(newPermission as 'granted' | 'denied' | 'prompt')
            if (newPermission === 'denied') {
              toast.error('تم رفض إذن الإشعارات')
            }
          }
        } else {
          setNotificationPermission('denied')
          toast.error('الإشعارات غير مدعومة في هذا المتصفح')
        }
      } catch (error) {
        setNotificationPermission('denied')
        toast.error('خطأ في طلب إذن الإشعارات')
      }
    }

    // Check permissions using Permissions API if available
    const checkPermissions = async () => {
      if (navigator.permissions) {
        try {
          const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
          setCameraPermission(cameraStatus.state)
          cameraStatus.addEventListener('change', () => {
            setCameraPermission(cameraStatus.state)
          })
        } catch (error) {
          console.error('Error checking camera permission:', error)
          setCameraPermission('unknown')
        }

        // Storage permission does not have Permissions API support, so request directly
        await requestStoragePermission()

        try {
          const notificationStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName })
          setNotificationPermission(notificationStatus.state)
          notificationStatus.addEventListener('change', () => {
            setNotificationPermission(notificationStatus.state)
          })
        } catch (error) {
          console.error('Error checking notification permission:', error)
          setNotificationPermission('unknown')
        }
      } else {
        setCameraPermission('unknown')
        setStoragePermission('unknown')
        setNotificationPermission('unknown')
      }
    }

    checkPermissions()
  }, [user, router])

  const formatLateness = (minutes: number) => {
    if (minutes === 0) return "في الموعد"
    if (minutes < 60) return `متأخر ${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `متأخر ${hours} ساعة${remainingMinutes > 0 ? ` و${remainingMinutes} دقيقة` : ""}`
  }

  const handleQRScan = async (qrData: string) => {
    setScannerLoading(true)
    try {
      const validation = validateQRSignature(qrData)
      if (!validation.valid || !validation.attendanceCode) {
        toast.error("كود QR غير صالح")
        return
      }

      const member = members.find(m => m.attendanceCode === validation.attendanceCode)

      if (member) {
        await handleAttendance(member, "qr")
        setShowScanner(false)
        toast.success(`تم تسجيل حضور ${member.fullName}`)
      } else {
        toast.error("لم يتم العثور على المخدوم بهذا الكود")
      }
    } catch (error) {
      console.error("Error processing QR data:", error)
      toast.error("خطأ في معالجة كود QR")
    } finally {
      setScannerLoading(false)
    }
  }

  const handleAttendance = async (member: Member, method: "manual" | "qr" | "scan") => {
    if (!currentMeeting) {
      toast.error("يرجى اختيار اجتماع أولاً")
      return
    }

    const todaysLogs = getTodaysAttendance()
    if (todaysLogs.some(log => log.memberId === member.id)) {
      toast.error("تم تسجيل الحضور بالفعل لهذا العضو اليوم")
      return
    }

    try {
      const attendanceData: Omit<AttendanceLog, "id"> = {
        memberId: member.id!,
        meetingId: currentMeeting.id!,
        checkInTimestamp: new Date(),
        checkInMethod: method,
        recordedBy: user?.uid || "",
      }

      if (isOffline) {
        addOfflineAttendance(attendanceData)
        toast.success("تم حفظ الحضور محلياً (غير متصل)")
      } else {
        // Use the correct method name from firestoreHelpers
        await firestoreHelpers.addAttendanceLog(attendanceData)
        toast.success("تم تسجيل الحضور بنجاح")
      }
    } catch (error) {
      console.error("Error recording attendance:", error)
      toast.error("خطأ في تسجيل الحضور")
    }
  }

  const handleManualAttendance = (member: Member) => {
    handleAttendance(member, "manual")
  }

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) {
      toast.error("يرجى إدخال الكود")
      return
    }

    try {
      const validation = validateQRSignature(manualCode.trim())
      if (!validation.valid || !validation.attendanceCode) {
        toast.error("كود غير صالح")
        return
      }

      const member = members.find(m => m.attendanceCode === validation.attendanceCode)

      if (member) {
        await handleAttendance(member, "manual")
        setShowManualDialog(false)
        setManualCode("")
        toast.success(`تم تسجيل حضور ${member.fullName}`)
      } else {
        toast.error("لم يتم العثور على المخدوم بهذا الكود")
      }
    } catch (error) {
      console.error("Error processing manual code:", error)
      toast.error("خطأ في معالجة الكود")
    }
  }

  const handleNumberScan = async (numberData: string) => {
    setNumberScannerLoading(true)
    try {
      const validation = validateQRSignature(numberData.trim())
      if (!validation.valid || !validation.attendanceCode) {
        toast.error("رقم الكود غير صالح")
        return
      }

      const member = members.find(m => m.attendanceCode === validation.attendanceCode)

      if (member) {
        await handleAttendance(member, "scan")
        setShowNumberScanner(false)
        setStartNumberScanner(false)
        toast.success(`تم تسجيل حضور ${member.fullName}`)
      } else {
        toast.error("لم يتم العثور على المخدوم بهذا الرقم")
      }
    } catch (error) {
      console.error("Error processing number data:", error)
      toast.error("خطأ في معالجة رقم الكود")
    } finally {
      setNumberScannerLoading(false)
    }
  }

  const handleExportAttendance = () => {
    try {
      const filteredLogs = attendanceLogs.filter(log => {
        if (!exportDateRange.startDate || !exportDateRange.endDate) return true
        const logDate = log.checkInTimestamp.toDateString()
        const startDate = new Date(exportDateRange.startDate).toDateString()
        const endDate = new Date(exportDateRange.endDate).toDateString()
        return logDate >= startDate && logDate <= endDate
      })

      ExcelService.exportAttendance(filteredLogs, members, meetings)
      toast.success("تم تصدير تقرير الحضور بنجاح")
      setExportDialogOpen(false)
    } catch (error) {
      toast.error("خطأ في تصدير التقرير")
    }
  }

  const getMemberAttendanceLogs = (memberId: string) => {
    return attendanceLogs.filter(log => log.memberId === memberId)
  }

  const getTodaysAttendance = () => {
    const today = new Date().toDateString()
    return attendanceLogs.filter(log => log.checkInTimestamp.toDateString() === today)
  }

  const hasAttendedToday = (memberId: string) => {
    return getTodaysAttendance().some(log => log.memberId === memberId)
  }

  const displayAttendanceLogs = getTodaysAttendance()
  const filteredMembers = members.filter((member) =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const startScanner = async () => {
    // Re-request camera permission if denied or prompt before starting scanner
    if (cameraPermission === 'denied' || cameraPermission === 'prompt') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraPermission('granted')
        stream.getTracks().forEach(track => track.stop())
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          setCameraPermission('denied')
          toast.error('تم رفض إذن الكاميرا')
          return
        } else {
          setCameraPermission('prompt')
          toast.error('يرجى السماح بإذن الكاميرا')
          return
        }
      }
    }

    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(console.error)
    }
    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )
    html5QrcodeScannerRef.current.render(
      (decodedText) => {
        handleQRScan(decodedText)
        html5QrcodeScannerRef.current?.clear().catch(console.error)
      },
      (errorMessage: string) => {
        console.error("QR Scan error:", errorMessage)
      }
    )
  }

  if (membersLoading || attendanceLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تسجيل الحضور</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {role === "admin" ? "إدارة حضور الأعضاء والخدام" : "تسجيل حضورك"}
          </p>
        </div>

        <div className="flex gap-2">
          {role === "admin" && (
            <>
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير التقرير
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>تصدير تقرير الحضور</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input
                          type="date"
                          value={exportDateRange.startDate}
                          onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input
                          type="date"
                          value={exportDateRange.endDate}
                          onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>نوع التقرير</Label>
                      <Select
                        value={exportDateRange.reportType}
                        onValueChange={(value: "detailed" | "summary" | "comprehensive") =>
                          setExportDateRange({ ...exportDateRange, reportType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="detailed">مفصل</SelectItem>
                          <SelectItem value="summary">موجز</SelectItem>
                          <SelectItem value="comprehensive">شامل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleExportAttendance}>
                        تصدير
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <button type="button" className="border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-3 py-1 rounded text-sm" onClick={async () => {
                // Re-request camera permission if denied or prompt
                if (cameraPermission !== 'granted') {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                    setCameraPermission('granted')
                    stream.getTracks().forEach(track => track.stop())
                  } catch (error: any) {
                    if (error.name === 'NotAllowedError') {
                      setCameraPermission('denied')
                      toast.error('تم رفض إذن الكاميرا')
                      return
                    } else {
                      setCameraPermission('prompt')
                      toast.error('يرجى السماح بإذن الكاميرا')
                      return
                    }
                  }
                }
                setShowScanner(true)
                setTimeout(startScanner, 100)
              }}>

                <span role="img" aria-label="scan">📷</span> مسح QR

              </button>

              <button type="button" className="border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-3 py-1 rounded text-sm" onClick={() => setShowManualDialog(true)}>
                <span role="img" aria-label="manual">⌨️</span> إدخال يدوي
              </button>

              <button type="button" className="border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-3 py-1 rounded text-sm" onClick={async () => {
                // Re-request camera permission if denied or prompt
                if (cameraPermission !== 'granted') {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                    setCameraPermission('granted')
                    stream.getTracks().forEach(track => track.stop())
                  } catch (error: any) {
                    if (error.name === 'NotAllowedError') {
                      setCameraPermission('denied')
                      toast.error('تم رفض إذن الكاميرا')
                      return
                    } else {
                      setCameraPermission('prompt')
                      toast.error('يرجى السماح بإذن الكاميرا')
                      return
                    }
                  }
                }
                setShowNumberScanner(true)
                setTimeout(() => setStartNumberScanner(true), 100)
              }}>

                <span role="img" aria-label="number-scan">🔢</span> مسح رقم الكود

              </button>
            </>
          )}

          {role === "member" && (() => {
            const currentMember = members.find(m => m.uid === user?.uid) || members[0]
            const attended = hasAttendedToday(currentMember?.id!)
            return (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleManualAttendance(currentMember)}
                  disabled={attended}
                >
                  <UserCheck className="w-4 h-4 ml-2" />
                  {attended ? 'تم التسجيل' : 'تسجيل حضوري'}
                </Button>
                <button type="button" className="border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-3 py-1 rounded text-sm" onClick={() => { if (cameraPermission === 'denied') { toast.error('الكاميرا غير متاحة. يرجى التأكد من تشغيل التطبيق عبر HTTPS ومنح إذن الوصول للكاميرا.'); return; } setShowScanner(true); setTimeout(startScanner, 100); }} disabled={attended || cameraPermission === 'denied'}>
                  <span role="img" aria-label="scan">📷</span> QR
                </button>
              </div>
            )
          })()}
        </div>
      </motion.div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">تسجيل الحضور</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {/* Meeting Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                  اختيار الاجتماع *
                </Label>
                <Select
                  value={currentMeeting?.id || ""}
                  onValueChange={(value) => {
                    const meeting = meetings.find(m => m.id === value)
                    setCurrentMeeting(meeting || null)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الاجتماع" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {meetings
                      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date
                      .map((meeting) => (
                        <SelectItem key={meeting.id} value={meeting.id!} className="py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary-700 dark:text-primary-300">
                                {meeting.startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                              {meeting.date < new Date() && (
                                <Badge variant="secondary" className="text-xs mr-2">ماضي</Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {meeting.title}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {currentMeeting && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">تم اختيار الاجتماع</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن مخدوم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredMembers.length} مخدوم
            </Badge>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glassy className={`hover:shadow-lg transition-shadow ${hasAttendedToday(member.id!) ? 'opacity-50 pointer-events-none' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      {member.fullName}
                      {member.role === "admin" && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">الهاتف:</span> {member.phonePrimary}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">المرحلة:</span> {t(member.classStage)}
                    </p>

                    <div className="flex gap-2 mt-4">
                      {role === "admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleManualAttendance(member)}
                          disabled={hasAttendedToday(member.id!)}
                        >
                          {hasAttendedToday(member.id!) ? 'تم التسجيل' : 'تسجيل حضور'}
                        </Button>
                      )}

                      {role === "member" && member.uid === user?.uid && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleManualAttendance(member)}
                          disabled={hasAttendedToday(member.id!)}
                        >
                          {hasAttendedToday(member.id!) ? 'تم التسجيل' : 'تسجيل حضوري'}
                        </Button>
                      )}
                    </div>

                    {/* Show attendance status for today */}
                    {hasAttendedToday(member.id!) && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">حاضر اليوم</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">لا توجد أعضاء مطابقة لبحثك</p>
            </motion.div>
          )}

          {meetings.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md mx-auto">
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  لا توجد اجتماعات متاحة حالياً
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  يمكنك إنشاء اجتماعات جديدة من خلال:
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    1. الانتقال إلى صفحة "مولد الاجتماعات" في لوحة الإدارة
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    2. أو تشغيل الأمر: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npx tsx scripts/generate-meetings.ts</code>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  تقرير حضور اليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{members.length}</div>
                      <div className="text-sm text-gray-600">إجمالي الأعضاء</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{displayAttendanceLogs.length}</div>
                      <div className="text-sm text-gray-600">حاضرون اليوم</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {members.length - displayAttendanceLogs.length}
                      </div>
                      <div className="text-sm text-gray-600">غائبون</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">قائمة الحضور:</h4>
                    {displayAttendanceLogs.map((log, index) => {
                      const member = members.find(m => m.id === log.memberId)
                      return (
                        <div
                          key={log.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{member?.fullName || "مخدوم غير معروف"}</p>
                              <p className="text-sm text-gray-600">
                                {log.checkInTimestamp.toLocaleTimeString("ar-EG")}
                              </p>
                            </div>
                            {member?.role === "admin" && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
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
                        <p className="text-gray-500 dark:text-gray-400">لا توجد سجلات حضور لهذا اليوم</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Dialog open={showScanner} onOpenChange={(open) => { setShowScanner(open); if (!open && html5QrcodeScannerRef.current) html5QrcodeScannerRef.current.clear().catch(console.error); }}>
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
              <div id="reader" className="w-full"></div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">وجه الكاميرا نحو كود QR الخاص بالعضو</p>
              <Button variant="outline" onClick={() => setShowScanner(false)} className="mt-2">
                <X className="w-4 h-4 ml-2" />
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span role="img" aria-label="manual">⌨️</span>
              إدخال كود يدوي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">أدخل كود QR أو كود الحضور</Label>
              <Input
                id="manual-code"
                placeholder="أدخل الكود هنا..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualCodeSubmit()
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowManualDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleManualCodeSubmit}>
                تسجيل الحضور
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNumberScanner} onOpenChange={(open) => { setShowNumberScanner(open); if (!open) setStartNumberScanner(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span role="img" aria-label="number-scan">🔢</span>
              مسح رقم الكود
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {numberScannerLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mr-2">جاري معالجة رقم الكود...</p>
              </div>
            ) : (
              <NumberScanner
                onScan={handleNumberScan}
                onError={(error) => {
                  console.error("Number Scanner error:", error)
                  toast.error(error)
                }}
                start={startNumberScanner}
              />
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">وجه الكاميرا نحو رقم الكود الخاص بالعضو</p>
              <Button variant="outline" onClick={() => setShowNumberScanner(false)} className="mt-2">
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
