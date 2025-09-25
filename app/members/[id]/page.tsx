"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Phone, MapPin, User, Edit, QrCode, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import toast from "react-hot-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RoleGuard } from "@/components/auth/role-guard"
import { FloatingBackButton } from "@/components/layout/floating-back-button"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

export default function MemberProfilePage() {
  const { role } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    numberOfAttendances: number
    attendancePercentage: number
    averageTime: number
    totalMeetings: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true)
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(`/api/members?id=${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error("Failed to fetch member data")
        }
        const data = await res.json()
        setMember(data)
      } catch (error) {
        console.error("Error fetching member:", error)
        toast.error("خطأ في جلب بيانات المخدوم")
      } finally {
        setLoading(false)
      }
    }
    fetchMember()
  }, [params.id])

  useEffect(() => {
    if (!member?.id) return

    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        // Fetch attendances for this member
        const attendancesRef = collection(db, "attendance_logs")
        const q = query(attendancesRef, where("memberId", "==", member.id))
        const attendancesSnap = await getDocs(q)
        const attendances = attendancesSnap.docs.map(doc => doc.data())

        const numberOfAttendances = attendances.length

        // Calculate average time
        let totalDuration = 0
        let countWithDuration = 0
        attendances.forEach(att => {
          if (att.checkOutTimestamp && att.checkInTimestamp) {
            const checkIn = att.checkInTimestamp.toDate()
            const checkOut = att.checkOutTimestamp.toDate()
            const duration = (checkOut - checkIn) / (1000 * 60) // minutes
            totalDuration += duration
            countWithDuration++
          }
        })
        const averageTime = countWithDuration > 0 ? totalDuration / countWithDuration : 0

        // Fetch total meetings
        const meetingsRef = collection(db, "meetings")
        const meetingsSnap = await getDocs(meetingsRef)
        const totalMeetings = meetingsSnap.docs.length

        const attendancePercentage = totalMeetings > 0 ? (numberOfAttendances / totalMeetings) * 100 : 0

        setStats({
          numberOfAttendances,
          attendancePercentage,
          averageTime,
          totalMeetings
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast.error("خطأ في جلب إحصائيات الحضور")
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [member?.id])

  const handleEditClick = () => {
    router.push(`/members/${params.id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!member) {
    return (
      <RoleGuard adminOnly>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على العضو</p>
            <Button onClick={() => router.back()} className="mt-4">
              العودة
            </Button>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard adminOnly>
      <div className="p-6 space-y-6">
        <FloatingBackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hidden lg:flex">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ملف العضو</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">تفاصيل العضو الكاملة</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const qrData = {
                  id: member.id,
                  name: member.fullName,
                  phone: member.phonePrimary,
                };
                const qrString = JSON.stringify(qrData);
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
                window.open(qrUrl, '_blank');
              }}
            >
              <QrCode className="w-4 h-4 ml-2" />
              رمز QR
            </Button>
            <Button onClick={handleEditClick}>
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader className="text-center">
                <div className="mx-auto w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl || "/placeholder.svg"}
                      alt={member.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">{member.fullName}</CardTitle>
                <Badge variant="secondary">
                  {t(member.classStage)}
                  {member.universityYear && ` - السنة ${member.universityYear}`}
                </Badge>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card glassy>
              <CardHeader>
                <CardTitle>معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">الهاتف الأساسي</p>
                    <p className="text-gray-600 dark:text-gray-400">{member.phonePrimary}</p>
                  </div>
                </div>

                {member.phoneSecondary && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">الهاتف الثانوي</p>
                      <p className="text-gray-600 dark:text-gray-400">{member.phoneSecondary}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">العنوان</p>
                    <p className="text-gray-600 dark:text-gray-400">{member.address.addressString}</p>
                    {member.address.mapsUrl && (
                      <a
                        href={member.address.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        عرض على الخريطة
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Church Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card glassy>
              <CardHeader>
                <CardTitle>معلومات الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">أب الاعتراف</p>
                    <p className="text-gray-600 dark:text-gray-400">{member.confessorName}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">تاريخ الميلاد</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("ar-EG") : "غير محدد"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">تاريخ الانضمام</p>
                    <p className="text-gray-600 dark:text-gray-400">{new Date(member.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                </div>

                {member.notes && (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">ملاحظات</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{member.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3"
          >
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  إحصائيات الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.numberOfAttendances}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">عدد مرات الحضور</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.attendancePercentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نسبة الحضور</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.averageTime > 60
                          ? `${(stats.averageTime / 60).toFixed(1)} ساعة`
                          : `${stats.averageTime.toFixed(0)} دقيقة`
                        }
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">متوسط وقت الحضور</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalMeetings}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الاجتماعات</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    لا توجد بيانات إحصائية متاحة
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  )
}
