"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Calendar, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardStats {
  totalMembers: number
  todayAttendance: number
  averageAttendance: number
  upcomingMeetings: number
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading dashboard stats
    setTimeout(() => {
      setStats({
        totalMembers: 45,
        todayAttendance: 32,
        averageAttendance: 38,
        upcomingMeetings: 2,
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      title: t("totalMembers"),
      value: stats?.totalMembers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: t("todayAttendance"),
      value: stats?.todayAttendance || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: t("averageAttendance"),
      value: stats?.averageAttendance || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "الاجتماعات القادمة",
      value: stats?.upcomingMeetings || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مرحباً، {user?.displayName}</h1>
        <p className="text-gray-600 dark:text-gray-400">إليك نظرة عامة على خدمة الشباب اليوم</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {role === "admin" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-gray-900 dark:text-white">إضافة عضو جديد</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إضافة عضو جديد إلى الخدمة</p>
                </button>

                <button className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-gray-900 dark:text-white">تسجيل الحضور</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تسجيل حضور الاجتماع الحالي</p>
                </button>

                <button className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-gray-900 dark:text-white">إرسال إشعار</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إرسال إشعار لجميع الأعضاء</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
