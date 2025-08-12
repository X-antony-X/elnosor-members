"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Phone, MapPin, QrCode, Calendar, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { generateMemberQR } from "@/lib/utils"
import QRCode from "react-qr-code"

export default function MemberProfilePage() {
  const { user, role } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (!user) return

    setTimeout(() => {
      // Mock member data - in real app, fetch from Firestore using user.uid
      setMember({
        id: user.uid,
        uid: user.uid,
        fullName: user.displayName || "مينا جورج إبراهيم",
        phonePrimary: "01234567890",
        phoneSecondary: "01098765432",
        address: {
          addressString: "شارع الجمهورية، القاهرة الجديدة",
          lat: 30.0444,
          lng: 31.2357,
          mapsUrl: "https://maps.google.com/?q=30.0444,31.2357",
        },
        classStage: "university",
        universityYear: 2,
        confessorName: "أبونا يوسف الأنطوني",
        photoUrl: user.photoURL || "/placeholder.svg?height=200&width=200",
        notes: "عضو نشط في الخدمة، يحضر بانتظام",
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date(),
      })
      setLoading(false)
    }, 1000)
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">يرجى تسجيل الدخول أولاً</p>
        </div>
      </div>
    )
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
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على بيانات العضو</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ملفي الشخصي</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">بياناتك الشخصية ورمز الحضور</p>
        </div>

        <div className="flex gap-2">
          <Button variant={showQR ? "primary" : "outline"} size="sm" onClick={() => setShowQR(!showQR)}>
            <QrCode className="w-4 h-4 ml-2" />
            {showQR ? "إخفاء QR" : "عرض QR"}
          </Button>
          {role === "admin" && (
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
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

          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mt-4">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">رمز الحضور الخاص بك</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اعرض هذا الرمز للخادم لتسجيل حضورك</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-6 rounded-lg inline-block shadow-sm">
                    <QRCode
                      value={generateMemberQR(member.id!)}
                      size={180}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">صالح لجلسة الحضور الحالية</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
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
          <Card>
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
                  <p className="font-medium text-gray-900 dark:text-white">تاريخ الانضمام</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 inline ml-1" />
                    {member.createdAt.toLocaleDateString("ar-EG")}
                  </p>
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
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <QrCode className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">كيفية استخدام رمز الحضور</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• اضغط على "عرض QR" لإظهار رمزك الشخصي</li>
                  <li>• اعرض الرمز للخادم المسؤول عند الوصول</li>
                  <li>• سيتم تسجيل حضورك تلقائياً مع الوقت الدقيق</li>
                  <li>• تأكد من وضوح الرمز عند المسح</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
