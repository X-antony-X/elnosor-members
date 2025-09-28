"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Phone, MapPin, QrCode, Calendar, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { generateMemberQR, generateAttendanceCode } from "@/lib/utils"
import QRCode from "react-qr-code"
import toast from "react-hot-toast"
import { firestoreHelpers } from "@/hooks/use-firestore"

export default function MemberProfilePage() {
  const { user, role } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Member>>({})

  const generateUniqueAttendanceCode = async (): Promise<string> => {
    // Use the new sequential code generation from utils
    return await generateAttendanceCode()
  }

  useEffect(() => {
    if (!user) return

    const fetchMemberData = async () => {
      setLoading(true)
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const docRef = doc(db, "members", user.uid)
        const memberDoc = await getDoc(docRef)

        if (memberDoc.exists()) {
          const memberData = {
            id: memberDoc.id,
            ...memberDoc.data(),
            createdAt: memberDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: memberDoc.data().updatedAt?.toDate() || new Date(),
          } as Member

          // Generate attendance code if missing
          if (!memberData.attendanceCode) {
            try {
              const code = await generateUniqueAttendanceCode()
              await firestoreHelpers.updateMember(memberDoc.id, { attendanceCode: code })
              memberData.attendanceCode = code
            } catch (error) {
              console.error("Error generating attendance code:", error)
              toast.error("خطأ في إنشاء كود الحضور")
            }
          }

          setMember(memberData)
          setEditData(memberData)
        } else {
          toast.error("لم يتم العثور على بيانات المخدوم")
        }
      } catch (error) {
        console.error("Error fetching member data:", error)
        toast.error("حدث خطأ في تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    fetchMemberData()
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

  const handleEdit = () => {
    setIsEditing(true)
    setEditData(member || {})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData(member || {})
  }

  const handleSave = async () => {
    if (!member) return

    setSaving(true)
    try {
      await firestoreHelpers.updateMember(member.id!, editData)
      setMember({ ...member, ...editData, updatedAt: new Date() })
      setIsEditing(false)
      toast.success("تم حفظ التغييرات بنجاح")
    } catch (error) {
      console.error("Error updating member:", error)
      toast.error("حدث خطأ في حفظ التغييرات")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const canEdit = role === "admin" || role === "member"

  if (!member) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على بيانات المخدوم</p>
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
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ
                  </>
                )}
              </Button>
            </>
          )}
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

          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card glassy className="mt-4">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">رمز الحضور الخاص بك</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اعرض هذا الرمز للخادم لتسجيل حضورك</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2 tracking-wider">
                      {member.attendanceCode}
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">كود الحضور الخاص بك</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">اعرض هذا الكود أو الرمز للخادم</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg inline-block shadow-sm border-2 border-gray-200">
                    <QRCode
                      value={generateMemberQR(member.attendanceCode!)}
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">يحتوي الرمز على الكود الرقمي فقط</p>
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
          <Card glassy>
            <CardHeader>
              <CardTitle>معلومات الاتصال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الهاتف الأساسي</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        value={editData.phonePrimary || ""}
                        onChange={(e) => handleInputChange("phonePrimary", e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                      <Phone className="w-4 h-4 ml-2" />
                      {member.phonePrimary}
                    </p>
                  )}
                </div>

                <div>
                  <Label>الهاتف الثانوي</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        value={editData.phoneSecondary || ""}
                        onChange={(e) => handleInputChange("phoneSecondary", e.target.value)}
                        placeholder="اختياري"
                      />
                    </div>
                  ) : (
                    member.phoneSecondary ? (
                      <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                        <Phone className="w-4 h-4 ml-2" />
                        {member.phoneSecondary}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 mt-1">غير محدد</p>
                    )
                  )}
                </div>
              </div>

              <div>
                <Label>العنوان</Label>
                {isEditing ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      className="pl-10 min-h-[80px]"
                      value={editData.address?.addressString || ""}
                      onChange={(e) => handleInputChange("address", {
                        ...editData.address,
                        addressString: e.target.value
                      })}
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className="text-gray-600 dark:text-gray-400 flex items-start">
                      <MapPin className="w-4 h-4 ml-2 mt-0.5" />
                      <span>{member.address.addressString}</span>
                    </p>
                    {member.address.mapsUrl && (
                      <a
                        href={member.address.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm mr-6"
                      >
                        عرض على الخريطة
                      </a>
                    )}
                  </div>
                )}
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
        <Card glassy className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
