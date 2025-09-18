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
import toast from "react-hot-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RoleGuard } from "@/components/auth/role-guard"
import { FloatingBackButton } from "@/components/layout/floating-back-button"
import { ImageUpload } from "@/components/ui/image-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MemberProfilePage() {
  const { role } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("")
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phonePrimary: "",
    phoneSecondary: "",
    address: "",
    confessorName: "",
    classStage: "",
    universityYear: "",
    notes: "",
  })

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

  const handleEditClick = () => {
    if (!member) return

    setEditFormData({
      fullName: member.fullName,
      phonePrimary: member.phonePrimary,
      phoneSecondary: member.phoneSecondary || "",
      address: member.address.addressString,
      confessorName: member.confessorName,
      classStage: member.classStage,
      universityYear: member.universityYear?.toString() || "",
      notes: member.notes || "",
    })
    setUploadedPhotoUrl(member.photoUrl || "")
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!member) return

    setSaving(true)
    try {
      // Simulate API call to update member
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updatedMember = {
        ...member,
        fullName: editFormData.fullName,
        phonePrimary: editFormData.phonePrimary,
        phoneSecondary: editFormData.phoneSecondary || undefined,
        address: {
          addressString: editFormData.address,
        },
        confessorName: editFormData.confessorName,
        classStage: editFormData.classStage as "graduation" | "university",
        universityYear: editFormData.classStage === "university" ? parseInt(editFormData.universityYear) : undefined,
        photoUrl: uploadedPhotoUrl || member.photoUrl,
        notes: editFormData.notes,
        updatedAt: new Date(),
      }

      setMember(updatedMember)
      setEditDialogOpen(false)
      toast.success("تم تحديث البيانات بنجاح")
    } catch (error) {
      console.error("Error updating member:", error)
      toast.error("حدث خطأ في تحديث البيانات")
    } finally {
      setSaving(false)
    }
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
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
            <Button variant="outline" size="sm">
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل بيانات العضو</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <Label>الصورة الشخصية</Label>
                <div className="mt-2">
                  <ImageUpload
                    uploadType="member"
                    entityId={member.id}
                    currentImage={uploadedPhotoUrl}
                    onUpload={(url) => setUploadedPhotoUrl(url)}
                    showSourceSelector={true}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="edit-fullName">الاسم الكامل *</Label>
                <Input
                  id="edit-fullName"
                  value={editFormData.fullName}
                  onChange={(e) => handleEditInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phonePrimary">رقم الهاتف الأساسي *</Label>
                  <Input
                    id="edit-phonePrimary"
                    type="tel"
                    value={editFormData.phonePrimary}
                    onChange={(e) => handleEditInputChange("phonePrimary", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phoneSecondary">رقم الهاتف الثانوي (اختياري)</Label>
                  <Input
                    id="edit-phoneSecondary"
                    type="tel"
                    value={editFormData.phoneSecondary}
                    onChange={(e) => handleEditInputChange("phoneSecondary", e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="edit-address">العنوان *</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => handleEditInputChange("address", e.target.value)}
                  required
                />
              </div>

              {/* Confessor Name */}
              <div>
                <Label htmlFor="edit-confessorName">اسم الأب الروحي *</Label>
                <Input
                  id="edit-confessorName"
                  value={editFormData.confessorName}
                  onChange={(e) => handleEditInputChange("confessorName", e.target.value)}
                  required
                />
              </div>

              {/* Education Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-classStage">المرحلة الدراسية *</Label>
                  <Select value={editFormData.classStage} onValueChange={(value) => handleEditInputChange("classStage", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة الدراسية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="university">جامعي</SelectItem>
                      <SelectItem value="graduation">خريج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editFormData.classStage === "university" && (
                  <div>
                    <Label htmlFor="edit-universityYear">السنة الجامعية *</Label>
                    <Select value={editFormData.universityYear} onValueChange={(value) => handleEditInputChange("universityYear", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السنة الجامعية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">السنة الأولى</SelectItem>
                        <SelectItem value="2">السنة الثانية</SelectItem>
                        <SelectItem value="3">السنة الثالثة</SelectItem>
                        <SelectItem value="4">السنة الرابعة</SelectItem>
                        <SelectItem value="5">السنة الخامسة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="edit-notes">ملاحظات</Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) => handleEditInputChange("notes", e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveEdit} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التغييرات"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
