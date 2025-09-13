"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Calendar, TrendingUp, BarChart3, LucidePieChart, Activity, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/providers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAnalytics } from "@/hooks/use-analytics"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
} from "recharts"

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [dateRange, setDateRange] = useState<string>("30")
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: Date; end: Date } | undefined>()

  useEffect(() => {
    const days = Number.parseInt(dateRange)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setAnalyticsDateRange({ start, end })
  }, [dateRange])

  const { analytics, loading } = useAnalytics(analyticsDateRange)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لا توجد بيانات كافية للتحليل</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "إجمالي الأعضاء",
      value: analytics.totalMembers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "معدل الحضور",
      value: `${analytics.attendanceRate}%`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "الأعضاء النشطون",
      value: analytics.activeMembers,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "معدل التفاعل",
      value: `${analytics.engagementRate}%`,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      change: "-2%",
      changeType: "negative" as const,
    },
  ]

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4"]

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مرحباً، {user?.displayName}</h1>
            <p className="text-gray-600 dark:text-gray-400">لوحة تحليلات خدمة الشباب</p>
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 3 أشهر</SelectItem>
              <SelectItem value="365">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              <Card glassy>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p
                        className={`text-sm mt-1 ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}
                      >
                        {stat.change} من الشهر الماضي
                      </p>
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

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="members">الأعضاء</TabsTrigger>
          <TabsTrigger value="engagement">التفاعل</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  اتجاه الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => `التاريخ: ${new Date(label).toLocaleDateString("ar-EG")}`}
                      formatter={(value, name) => [value, name === "count" ? "عدد الحضور" : "معدل الحضور %"]}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Attendance */}
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  الحضور الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.weeklyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => `الأسبوع: ${label}`}
                      formatter={(value) => [value, "عدد الحضور"]}
                    />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Attendees */}
          <Card glassy>
            <CardHeader>
              <CardTitle>أفضل الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.memberAttendanceStats.slice(0, 10).map((member, index) => (
                  <div
                    key={member.memberId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-orange-600"
                                : "bg-blue-500"
                          }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">{member.memberName}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{member.attendanceRate}%</div>
                      <div className="text-sm text-gray-600">{member.attendanceCount} اجتماع</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members by Stage */}
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucidePieChart className="w-5 h-5" />
                  توزيع الأعضاء حسب المرحلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.membersByStage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ stage, count }) => `${stage}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.membersByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Member Growth */}
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  نمو الأعضاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [value, name === "total" ? "إجمالي الأعضاء" : "أعضاء جدد"]} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="إجمالي الأعضاء" />
                    <Line type="monotone" dataKey="new" stroke="#10B981" strokeWidth={2} name="أعضاء جدد" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Posts */}
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  المنشورات الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyPosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "عدد المنشورات"]} />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Posts */}
            <Card glassy>
              <CardHeader>
                <CardTitle>أكثر المنشورات تفاعلاً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.postEngagement.slice(0, 5).map((post, index) => (
                    <div
                      key={post.postId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">منشور #{post.postId.slice(-4)}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{post.engagement} تفاعل</div>
                        <div className="text-sm text-gray-600">
                          {post.likes} إعجاب، {post.comments} تعليق
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Meeting Performance */}
          <Card glassy>
            <CardHeader>
              <CardTitle>أداء الاجتماعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.meetingStats.slice(0, 10).map((meeting, index) => (
                  <div key={meeting.meetingId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{meeting.title}</h3>
                      <p className="text-sm text-gray-600">{meeting.attendanceCount} حاضر</p>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">{meeting.attendanceRate}%</div>
                      <div className="text-sm text-gray-600">معدل الحضور</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {role === "admin" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card glassy>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-gray-900 dark:text-white">إضافة عضو جديد</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إضافة عضو جديد إلى الخدمة</p>
                </button>

                <button type="button" className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-gray-900 dark:text-white">تسجيل الحضور</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تسجيل حضور الاجتماع الحالي</p>
                </button>

                <button type="button"className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
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
