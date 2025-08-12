"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Download, Upload, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Member } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/auth/role-guard"

export default function MembersPage() {
  const { role } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
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
      setLoading(false)
    }, 1000)
  }, [])

  const filteredMembers = members.filter((member) => member.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleMemberClick = (memberId: string) => {
    router.push(`/members/${memberId}`)
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
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 ml-2" />
              استيراد
            </Button>
            <Button variant="outline" size="sm">
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
                onClick={() => handleMemberClick(member.id)}
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
