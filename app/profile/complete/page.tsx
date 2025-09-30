"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/app/providers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ImageUpload } from "@/components/ui/image-upload"
import { CalendarIcon, Upload, User, Phone, MapPin, GraduationCap } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import toast from "react-hot-toast"
import { cn, generateAttendanceCode } from "@/lib/utils"
import type { Member } from "@/lib/types"
import { firestoreHelpers } from "@/hooks/use-firestore"

export default function ProfileCompletePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { addMember, updateMember } = firestoreHelpers
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDatePopoverOpen, setBirthDatePopoverOpen] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("")
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phonePrimary: "",
    phoneSecondary: "",
    address: "",
    confessorName: "",
    classStage: "",
    universityYear: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    // Check if profile already exists
    const checkExistingProfile = async () => {
      setLoading(true)
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const docRef = doc(db, "members", user.uid)
        const memberDoc = await getDoc(docRef)

        if (memberDoc.exists()) {
          // Profile exists, redirect to dashboard
          router.push("/dashboard")
          return
        }
      } catch (error) {
        console.error("Error checking existing profile:", error)
      } finally {
        setLoading(false)
      }
    }

    checkExistingProfile()
  }, [user, router])

  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !birthDate) {
      toast.error("يرجى ملء جميع البيانات المطلوبة")
      return
    }

    const age = calculateAge(birthDate)

    if (age < 18) {
      toast("احضر اجتماعك الأساسي الأول ولما تدخل جامعة هتلاقينا مستنينك", {
        duration: 6000,
        icon: "📚",
      })
    }

    if (age > 28) {
      toast("ممكن تحضر اجتماع الحصن يوم الأربعاء من 6 لحد 9", {
        duration: 6000,
        icon: "⛪",
      })
    }

    setSaving(true)

    try {
      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()

      // Generate attendance code for the new member
      const attendanceCode = await generateAttendanceCode()

      const memberData: Omit<Member, 'id'> = {
        uid: user.uid,
        fullName,
        phonePrimary: formData.phonePrimary,
        ...(formData.phoneSecondary && { phoneSecondary: formData.phoneSecondary }),
        address: {
          addressString: formData.address,
        },
        classStage: formData.classStage as "graduation" | "university",
        ...(formData.classStage === "university" && { universityYear: parseInt(formData.universityYear) }),
        confessorName: formData.confessorName,
        attendanceCode,
        ...(uploadedPhotoUrl && { photoUrl: uploadedPhotoUrl }),
        ...(user.photoURL && !uploadedPhotoUrl && { photoUrl: user.photoURL }),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await addMember(memberData)

      toast.success("تم حفظ البيانات بنجاح")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("حدث خطأ في حفظ البيانات")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إكمال البيانات الشخصية</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            يرجى ملء البيانات التالية لإكمال تسجيلك في خدمة الشباب
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card glassy>
            <CardHeader>
              <CardTitle>البيانات الشخصية</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">الاسم الأول *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">اسم الأب *</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">اسم الجد *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phonePrimary">رقم الهاتف الأساسي *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phonePrimary"
                        type="tel"
                        className="pl-10"
                        value={formData.phonePrimary}
                        onChange={(e) => handleInputChange("phonePrimary", e.target.value)}
                        placeholder="01234567890"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phoneSecondary">رقم الهاتف الثانوي (اختياري)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phoneSecondary"
                        type="tel"
                        className="pl-10"
                        value={formData.phoneSecondary}
                        onChange={(e) => handleInputChange("phoneSecondary", e.target.value)}
                        placeholder="01098765432"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">العنوان *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      className="pl-10 min-h-[80px]"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="الشارع الفولاني عند ....."
                      required
                    />
                  </div>
                </div>

                {/* Confessor Name */}
                <div>
                  <Label htmlFor="confessorName">اسم الأب الروحي *</Label>
                  <Input
                    id="confessorName"
                    value={formData.confessorName}
                    onChange={(e) => handleInputChange("confessorName", e.target.value)}
                    placeholder="ابونا ..."
                    required
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <Label>تاريخ الميلاد *</Label>
                  <Popover open={birthDatePopoverOpen} onOpenChange={setBirthDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 rounded-lg border-2 transition-colors",
                          !birthDate && "text-muted-foreground hover:border-primary-300",
                          birthDate && "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 text-primary-600" />
                        {birthDate ? format(birthDate, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-lg border-2" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={(date) => {
                          setBirthDate(date)
                          setBirthDatePopoverOpen(false)
                        }}
                        defaultMonth={new Date(2000, 0, 1)}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1940-01-01")
                        }
                        captionLayout="dropdown"
                        fromYear={1960}
                        toYear={2010}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {birthDate && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                      العمر: {calculateAge(birthDate)} سنة
                    </p>
                  )}
                </div>

                {/* Education Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="classStage">المرحلة الدراسية *</Label>
                    <Select value={formData.classStage} onValueChange={(value) => handleInputChange("classStage", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المرحلة الدراسية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university">جامعي</SelectItem>
                        <SelectItem value="graduation">خريج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.classStage === "university" && (
                    <div>
                      <Label htmlFor="universityYear">السنة الجامعية *</Label>
                      <Select value={formData.universityYear} onValueChange={(value) => handleInputChange("universityYear", value)}>
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

                {/* Profile Picture */}
                <div>
                  <Label>الصورة الشخصية</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <ImageUpload
                      uploadType="member"
                      entityId={user?.uid || ""}
                      currentImage={uploadedPhotoUrl || user?.photoURL || ""}
                      onUpload={(url) => setUploadedPhotoUrl(url)}
                      showSourceSelector={true}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="ml-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ البيانات ومتابعة"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
