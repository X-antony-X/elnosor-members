"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import toast from "react-hot-toast"
import { useAuth } from "@/app/providers_old"

export default function MemberEditPage() {
  const { role, token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [memberData, setMemberData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
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
    if (!params.id) return
    const fetchMember = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/members/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error("Failed to fetch member data")
        }
        const data = await res.json()
        setMemberData(data)
        setFormData({
          fullName: data.fullName || "",
          phonePrimary: data.phonePrimary || "",
          phoneSecondary: data.phoneSecondary || "",
          address: data.address?.addressString || "",
          confessorName: data.confessorName || "",
          classStage: data.classStage || "",
          universityYear: data.universityYear?.toString() || "",
          notes: data.notes || "",
        })
      } catch (error) {
        toast.error("خطأ في جلب بيانات العضو")
      } finally {
        setLoading(false)
      }
    }
    fetchMember()
  }, [params.id, token])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!params.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/members/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phonePrimary: formData.phonePrimary,
          phoneSecondary: formData.phoneSecondary || undefined,
          address: {
            addressString: formData.address,
          },
          confessorName: formData.confessorName,
          classStage: formData.classStage,
          universityYear: formData.classStage === "university" ? parseInt(formData.universityYear) : undefined,
          notes: formData.notes,
          updatedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        throw new Error("Failed to update member")
      }
      toast.success("تم تحديث بيانات العضو بنجاح")
      router.push(`/members/${params.id}`)
    } catch (error) {
      toast.error("خطأ في تحديث بيانات العضو")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">تعديل بيانات العضو</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">الاسم الكامل *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phonePrimary">رقم الهاتف الأساسي *</Label>
            <Input
              id="phonePrimary"
              type="tel"
              value={formData.phonePrimary}
              onChange={(e) => handleInputChange("phonePrimary", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneSecondary">رقم الهاتف الثانوي (اختياري)</Label>
            <Input
              id="phoneSecondary"
              type="tel"
              value={formData.phoneSecondary}
              onChange={(e) => handleInputChange("phoneSecondary", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">العنوان *</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="confessorName">اسم الأب الروحي *</Label>
          <Input
            id="confessorName"
            value={formData.confessorName}
            onChange={(e) => handleInputChange("confessorName", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="classStage">المرحلة الدراسية *</Label>
            <Select
              value={formData.classStage}
              onValueChange={(value) => handleInputChange("classStage", value)}
            >
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
              <Select
                value={formData.universityYear}
                onValueChange={(value) => handleInputChange("universityYear", value)}
              >
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

        <div>
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="أي ملاحظات إضافية..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  )
}
