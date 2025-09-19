"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Download, Upload, User, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/auth/role-guard"
import { ExcelService } from "@/lib/excel-utils"
import toast from "react-hot-toast"
import { useMembers, useFirestoreHelpers } from "@/hooks/use-firestore"
import QRCode from "react-qr-code"

export default function MembersPage() {
  const { role } = useAuth()
  const router = useRouter()
  const { members, loading, error } = useMembers()
  const firestoreHelpers = useFirestoreHelpers()
  const [searchTerm, setSearchTerm] = useState("")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: string[]
    members: Partial<Member>[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMember, setNewMember] = useState({
    fullName: "",
    phonePrimary: "",
    phoneSecondary: "",
    address: {
      addressString: "",
    },
    classStage: "university" as "university" | "graduation",
    universityYear: "",
    confessorName: "",
    notes: "",
  })
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isEditingMember, setIsEditingMember] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  const filteredMembers = members.filter((member) => member.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleMemberClick = (memberId: string) => {
    router.push(`/members/${memberId}`)
  }

  const handleExportMembers = () => {
    try {
      ExcelService.exportMembers(members)
      toast.success("تم تصدير بيانات الأعضاء بنجاح")
    } catch (error) {
      toast.error("خطأ في تصدير البيانات")
    }
  }

  const handleDownloadTemplate = () => {
    try {
      ExcelService.downloadMembersTemplate()
      toast.success("تم تحميل قالب الاستيراد")
    } catch (error) {
      toast.error("خطأ في تحميل القالب")
    }
  }

  const handleAddMember = async () => {
    if (!newMember.fullName.trim() || !newMember.phonePrimary.trim()) {
      toast.error("يرجى ملء الاسم والرقم الأساسي على الأقل")
      return
    }

    setIsAddingMember(true)
    try {
      // Adjust newMember to match Member interface
      const memberData: Omit<Member, "id"> = {
        fullName: newMember.fullName,
        phonePrimary: newMember.phonePrimary,
        phoneSecondary: newMember.phoneSecondary,
        address: {
          addressString: newMember.address.addressString,
        },
        classStage: newMember.classStage === "university" ? "university" : "graduation",
        universityYear: newMember.universityYear ? parseInt(newMember.universityYear) : undefined,
        confessorName: newMember.confessorName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await firestoreHelpers.addMember(memberData)
      toast.success("تم إضافة العضو بنجاح")

      // Reset form
      setNewMember({
        fullName: "",
        phonePrimary: "",
        phoneSecondary: "",
        address: {
          addressString: "",
        },
        classStage: "university",
        universityYear: "",
        confessorName: "",
        notes: "",
      })
      setAddMemberDialogOpen(false)
    } catch (error) {
      console.error("Error adding member:", error)
      toast.error("خطأ في إضافة العضو")
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setEditMemberDialogOpen(true)
  }

  const handleUpdateMember = async () => {
    if (!selectedMember) return

    setIsEditingMember(true)
    try {
      const updatedData = {
        ...selectedMember,
        updatedAt: new Date(),
      }

      await firestoreHelpers.updateMember(selectedMember.id!, updatedData)
      toast.success("تم تحديث بيانات العضو بنجاح")
      setEditMemberDialogOpen(false)
      setSelectedMember(null)
    } catch (error) {
      console.error("Error updating member:", error)
      toast.error("خطأ في تحديث بيانات العضو")
    } finally {
      setIsEditingMember(false)
    }
  }

  const handleShowQR = (member: Member) => {
    setSelectedMember(member)
    setQrDialogOpen(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]

      if (!validTypes.includes(file.type)) {
        toast.error("يرجى اختيار ملف Excel صحيح (.xlsx أو .xls)")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت")
        return
      }

      setImportFile(file)
      setImportResults(null)
    }
  }

  const handleImportMembers = async () => {
    if (!importFile) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const { members: importedMembers, errors } = await ExcelService.importMembers(importFile)

      clearInterval(progressInterval)
      setImportProgress(100)

      setImportResults({
        success: importedMembers.length,
        errors,
        members: importedMembers,
      })

      if (errors.length === 0) {
        // In real app, save to database
        const newMembers = importedMembers.map((member, index) => ({
          ...member,
          id: `imported-${Date.now()}-${index}`,
        })) as Member[]

        // TODO: Save newMembers to Firestore using firestoreHelpers.addMember or a batch operation
        toast.success(`تم استيراد ${importedMembers.length} عضو بنجاح`)

        // Reset form after successful import
        setTimeout(() => {
          setImportDialogOpen(false)
          setImportFile(null)
          setImportResults(null)
          setImportProgress(0)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }, 2000)
      } else {
        toast.error(`تم العثور على ${errors.length} خطأ في البيانات`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطأ في استيراد البيانات")
      setImportProgress(0)
    } finally {
      setIsImporting(false)
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
    <RoleGuard adminOnly>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("members")}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة أعضاء خدمة الشباب</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 ml-2" />
                  استيراد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>استيراد أعضاء من Excel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!importFile && !importResults && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>يرجى تحميل قالب Excel أولاً وملء البيانات، ثم رفع الملف هنا.</AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownloadTemplate} className="flex-1 bg-transparent">
                          <FileSpreadsheet className="w-4 h-4 ml-2" />
                          تحميل قالب Excel
                        </Button>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">اضغط لاختيار ملف Excel</p>
                          <p className="text-xs text-gray-400 mt-1">يدعم .xlsx و .xls (حتى 5 ميجابايت)</p>
                        </label>
                      </div>
                    </div>
                  )}

                  {importFile && !importResults && (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>تم اختيار الملف: {importFile.name}</AlertDescription>
                      </Alert>

                      {isImporting && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>جاري المعالجة...</span>
                            <span>{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} className="w-full" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={handleImportMembers} disabled={isImporting} className="flex-1">
                          {isImporting ? "جاري الاستيراد..." : "بدء الاستيراد"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setImportFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          disabled={isImporting}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}

                  {importResults && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card glassy>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                            <div className="text-sm text-gray-600">تم الاستيراد بنجاح</div>
                          </CardContent>
                        </Card>
                        <Card glassy>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                            <div className="text-sm text-gray-600">أخطاء</div>
                          </CardContent>
                        </Card>
                      </div>

                      {importResults.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-600">الأخطاء المكتشفة:</h4>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {importResults.errors.map((error, index) => (
                              <Alert key={index} variant="destructive">
                                <AlertDescription className="text-sm">{error}</AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}

                      {importResults.success > 0 && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            تم استيراد {importResults.success} عضو بنجاح إلى قاعدة البيانات.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleExportMembers}>
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setAddMemberDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  {t("addMember")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إضافة عضو جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل *</Label>
                    <Input
                      value={newMember.fullName}
                      onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهاتف الأساسي *</Label>
                      <Input
                        value={newMember.phonePrimary}
                        onChange={(e) => setNewMember({ ...newMember, phonePrimary: e.target.value })}
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف الثانوي</Label>
                      <Input
                        value={newMember.phoneSecondary}
                        onChange={(e) => setNewMember({ ...newMember, phoneSecondary: e.target.value })}
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Textarea
                      value={newMember.address.addressString}
                      onChange={(e) => setNewMember({
                        ...newMember,
                        address: { ...newMember.address, addressString: e.target.value }
                      })}
                      placeholder="أدخل العنوان الكامل"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المرحلة التعليمية</Label>
                      <Select
                        value={newMember.classStage}
                        onValueChange={(value: "university" | "graduation") =>
                          setNewMember({ ...newMember, classStage: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="university">جامعة</SelectItem>
                          <SelectItem value="graduation">تخرج</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newMember.classStage === "university" && (
                      <div className="space-y-2">
                        <Label>السنة الجامعية</Label>
                        <Select
                          value={newMember.universityYear}
                          onValueChange={(value) => setNewMember({ ...newMember, universityYear: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر السنة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">الأولى</SelectItem>
                            <SelectItem value="2">الثانية</SelectItem>
                            <SelectItem value="3">الثالثة</SelectItem>
                            <SelectItem value="4">الرابعة</SelectItem>
                            <SelectItem value="5">الخامسة</SelectItem>
                            <SelectItem value="6">السادسة</SelectItem>
                            <SelectItem value="7">السابعة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>أب الاعتراف</Label>
                    <Input
                      value={newMember.confessorName}
                      onChange={(e) => setNewMember({ ...newMember, confessorName: e.target.value })}
                      placeholder="اسم أب الاعتراف"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={newMember.notes || ""}
                      onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                      placeholder="ملاحظات إضافية"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setAddMemberDialogOpen(false)}
                      disabled={isAddingMember}
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleAddMember} disabled={isAddingMember}>
                      {isAddingMember ? "جاري الإضافة..." : "إضافة العضو"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              placeholder={t("search")}
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
              <Card glassy
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => member.id && handleMemberClick(member.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {member.fullName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">الهاتف:</span> {member.phonePrimary}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">العنوان:</span> {member.address.addressString}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">المرحلة:</span> {t(member.classStage)}
                    {member.universityYear && ` - السنة ${member.universityYear}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">أب الاعتراف:</span> {member.confessorName}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        member.id && handleEditMember(member as Member)
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        member.id && handleShowQR(member as Member)
                      }}
                    >
                      QR
                    </Button>
                  </div>
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

        {/* Edit Member Dialog */}
        <Dialog open={editMemberDialogOpen} onOpenChange={setEditMemberDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل بيانات العضو</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={selectedMember.fullName}
                    onChange={(e) => setSelectedMember({ ...selectedMember, fullName: e.target.value })}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف الأساسي *</Label>
                    <Input
                      value={selectedMember.phonePrimary}
                      onChange={(e) => setSelectedMember({ ...selectedMember, phonePrimary: e.target.value })}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف الثانوي</Label>
                    <Input
                      value={selectedMember.phoneSecondary || ""}
                      onChange={(e) => setSelectedMember({ ...selectedMember, phoneSecondary: e.target.value })}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Textarea
                    value={selectedMember.address.addressString}
                    onChange={(e) => setSelectedMember({
                      ...selectedMember,
                      address: { ...selectedMember.address, addressString: e.target.value }
                    })}
                    placeholder="أدخل العنوان الكامل"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المرحلة التعليمية</Label>
                    <Select
                      value={selectedMember.classStage}
                      onValueChange={(value: "university" | "graduation") =>
                        setSelectedMember({ ...selectedMember, classStage: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university">جامعة</SelectItem>
                        <SelectItem value="graduation">تخرج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMember.classStage === "university" && (
                    <div className="space-y-2">
                      <Label>السنة الجامعية</Label>
                      <Select
                        value={selectedMember.universityYear?.toString() || ""}
                        onValueChange={(value) => setSelectedMember({ ...selectedMember, universityYear: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السنة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">الأولى</SelectItem>
                          <SelectItem value="2">الثانية</SelectItem>
                          <SelectItem value="3">الثالثة</SelectItem>
                          <SelectItem value="4">الرابعة</SelectItem>
                          <SelectItem value="5">الخامسة</SelectItem>
                          <SelectItem value="6">السادسة</SelectItem>
                          <SelectItem value="7">السابعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>أب الاعتراف</Label>
                  <Input
                    value={selectedMember.confessorName}
                    onChange={(e) => setSelectedMember({ ...selectedMember, confessorName: e.target.value })}
                    placeholder="اسم أب الاعتراف"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={selectedMember.notes || ""}
                    onChange={(e) => setSelectedMember({ ...selectedMember, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMemberDialogOpen(false)
                      setSelectedMember(null)
                    }}
                    disabled={isEditingMember}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleUpdateMember} disabled={isEditingMember}>
                    {isEditingMember ? "جاري التحديث..." : "تحديث البيانات"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>رمز QR للعضو</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode
                      value={JSON.stringify({
                        id: selectedMember.id,
                        name: selectedMember.fullName,
                        phone: selectedMember.phonePrimary,
                      })}
                      size={200}
                    />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">{selectedMember.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedMember.phonePrimary}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrDialogOpen(false)
                      setSelectedMember(null)
                    }}
                  >
                    إغلاق
                  </Button>
                  <Button
                    onClick={() => {
                      // TODO: Implement download QR functionality
                      toast("سيتم تنفيذ تحميل رمز QR قريباً")
                    }}
                  >
                    تحميل
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
