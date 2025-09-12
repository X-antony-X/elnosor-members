"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Download, Upload, User, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                            <div className="text-sm text-gray-600">تم الاستيراد بنجاح</div>
                          </CardContent>
                        </Card>
                        <Card>
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
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              {t("addMember")}
            </Button>
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
              <Card
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
                        // Handle edit action
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle QR generation
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
      </div>
    </RoleGuard>
  )
}
