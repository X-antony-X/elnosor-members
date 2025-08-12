"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Phone, MapPin, User, Edit, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function MemberProfilePage() {
  const { role } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role && role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [role, router])

  useEffect(() => {
    // Simulate loading member data
    setTimeout(() => {
      // Mock member data - in real app, fetch from Firestore
      setMember({
        id: params.id as string,
        fullName: "مينا جورج إبراهيم",
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
        photoUrl: "/placeholder.svg?height=200&width=200",
        notes: "عضو نشط في الخدمة، يحضر بانتظام",
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date(),
      })
      setLoading(false)
    }, 1000)
  }, [params.id])

  if (role !== "admin") {
    return null
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
          <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على العضو</p>
          <Button onClick={() => router.back()} className="mt-4">
            العودة
          </Button>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ملف العضو</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">تفاصيل العضو الكاملة</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="w-4 h-4 ml-2" />
            رمز QR
          </Button>
          <Button>
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </Button>
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
                  <p className="text-gray-600 dark:text-gray-400">{member.createdAt.toLocaleDateString("ar-EG")}</p>
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
    </div>
  )
}
