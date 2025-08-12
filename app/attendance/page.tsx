"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { QrCode, UserCheck, Clock, Calendar, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member, AttendanceLog, Meeting } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"

export default function AttendancePage() {
  const { role } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (role && role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [role, router])

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setMembers([
        {
          id: "1",
          fullName: "مينا جورج",
          phonePrimary: "01234567890",
          address: { addressString: "شارع الجمهورية، القاهرة" },
          classStage: "university",
          universityYear: 2,
          confessorName: "أبونا يوسف",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          fullName: "مريم سمير",
          phonePrimary: "01123456789",
          address: { addressString: "مدينة نصر، القاهرة" },
          classStage: "secondary",
          confessorName: "أبونا مرقس",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      setCurrentMeeting({
        id: "meeting-1",
        date: new Date(),
        startTime: new Date(new Date().setHours(19, 0, 0, 0)),
        endTime: new Date(new Date().setHours(21, 0, 0, 0)),
        title: "اجتماع الجمعة",
        description: "اجتماع أسبوعي للشباب",
        createdAt: new Date(),
      })

      setAttendanceLogs([
        {
          id: "1",
          memberId: "1",
          meetingId: "meeting-1",
          checkInTimestamp: new Date(new Date().setHours(19, 15, 0, 0)),
          checkOutTimestamp: new Date(new Date().setHours(20, 45, 0, 0)),
          checkInMethod: "qr",
          lateness: 15,
        },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  if (role !== "admin") {
    return null
  }

  const filteredMembers = members.filter((member) => member.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleManualCheckIn = async (memberId: string) => {
    if (!currentMeeting) return

    const newLog: AttendanceLog = {
      id: Date.now().toString(),
      memberId,
      meetingId: currentMeeting.id!,
      checkInTimestamp: new Date(),
      checkInMethod: "manual",
      lateness: Math.max(0, Math.floor((new Date().getTime() - currentMeeting.startTime.getTime()) / 60000)),
    }

    setAttendanceLogs([...attendanceLogs, newLog])
  }

  const handleCheckOut = async (logId: string) => {
    setAttendanceLogs(attendanceLogs.map((log) => (log.id === logId ? { ...log, checkOutTimestamp: new Date() } : log)))
  }

  const generateMemberQR = (memberId: string) => {
    // In real app, this would include a secure signature
    return JSON.stringify({
      memberId,
      meetingId: currentMeeting?.id,
      timestamp: Date.now(),
    })
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة حضور الأعضاء</p>
        </div>

        {currentMeeting && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
      </motion.div>

      <Tabs defaultValue="check-in" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check-in">{t("checkIn")}</TabsTrigger>
          <TabsTrigger value="qr-codes">أكواد QR</TabsTrigger>
          <TabsTrigger value="logs">{t("attendanceLog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="check-in" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
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
                    const hasCheckedIn = attendanceLogs.some(
                      (log) => log.memberId === member.id && log.meetingId === currentMeeting?.id,
                    )
                    const attendanceLog = attendanceLogs.find(
                      (log) => log.memberId === member.id && log.meetingId === currentMeeting?.id,
                    )

                    return (
                      <Card key={member.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{member.fullName}</h3>
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
                          ) : (
                            <Button size="sm" onClick={() => handleManualCheckIn(member.id!)} className="w-full">
                              {t("checkIn")}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="qr-codes" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  أكواد QR للأعضاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <Card key={member.id} className="text-center">
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t("attendanceLog")}
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceLogs.map((log) => {
                    const member = members.find((m) => m.id === log.memberId)
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

                  {attendanceLogs.length === 0 && (
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
    </div>
  )
}
