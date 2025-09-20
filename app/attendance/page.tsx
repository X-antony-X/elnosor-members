"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { QrCode, UserCheck, Clock, Calendar, Search, Download, Camera, X, FileSpreadsheet, Crown, Shield, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  const { user, role } = useAuth()
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
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    // Check camera permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((result) => {
        setCameraPermission(result.state)
        result.addEventListener('change', () => {
          setCameraPermission(result.state)
        })
      })
    }
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
      const memberData = JSON.parse(qrData)
      const member = members.find(m => m.id === memberData.id)

      if (member) {
        await handleAttendance(member, "qr")
        setShowQRScanner(false)
        toast.success(`تم تسجيل حضور ${member.fullName}`)
      } else {
        toast.error("لم يتم العثور على العضو")
      }
    } catch (error) {
      console.error("Error parsing QR data:", error)
      toast.error("خطأ في قراءة كود QR")
    } finally {
      setScannerLoading(false)
    }
  }

  const handleAttendance = async (member: Member, method: "manual" | "qr" | "scan") => {
    if (!currentMeeting) {
      toast.error("يرجى اختيار اجتماع أولاً")
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

  const displayAttendanceLogs = getTodaysAttendance()
  const filteredMembers = members.filter((member) =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRScanner(true)}
                disabled={cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 ml-2" />
                مسح QR
              </Button>
            </>
          )}

          {role === "member" && (
            <Button onClick={() => handleManualAttendance(members.find(m => m.uid === user?.uid) || members[0])}>
              <UserCheck className="w-4 h-4 ml-2" />
              تسجيل حضوري
            </Button>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">تسجيل الحضور</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن عضو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredMembers.length} عضو
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
                <Card glassy className="hover:shadow-lg transition-shadow">
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
                        >
                          تسجيل حضور
                        </Button>
                      )}

                      {role === "member" && member.uid === user?.uid && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleManualAttendance(member)}
                        >
                          تسجيل حضوري
                        </Button>
                      )}
                    </div>

                    {/* Show attendance status for today */}
                    {getMemberAttendanceLogs(member.id!).length > 0 && (
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
                              <p className="font-medium">{member?.fullName || "عضو غير معروف"}</p>
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
