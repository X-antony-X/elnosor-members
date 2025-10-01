"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Calendar, TrendingUp, BarChart3, LucidePieChart, Activity, Target, QrCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/providers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAnalytics } from "@/hooks/use-analytics"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import QRCode from "react-qr-code"
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

// Animation variants for mobile and desktop
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: ({ isMobile, index }: { isMobile: boolean; index: number }) => ({
    opacity: 0,
    x: isMobile && index % 2 === 0 ? -50 : isMobile && index % 2 === 1 ? 50 : 0,
    y: 20,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [dateRange, setDateRange] = useState<string>("30")
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: Date; end: Date } | undefined>()
  const [showQR, setShowQR] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  useEffect(() => {
    const days = Number.parseInt(dateRange)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setAnalyticsDateRange({ start, end })
  }, [dateRange])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await user?.getIdToken()
        const response = await fetch('/api/dashboard/data', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoadingDashboard(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const { analytics, loading } = useAnalytics(analyticsDateRange)

  // Member view stats
  const memberStatCards = [
    {
      title: "معدل حضوري",
      value: `${analytics?.attendanceRate ?? 0}%`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      change: analytics?.attendanceRateChange ? `${analytics.attendanceRateChange >= 0 ? '+' : ''}${analytics.attendanceRateChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.attendanceRateChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
    {
      title: "مشاركاتي",
      value: analytics?.memberAttendanceStats.find(m => m.memberId === user?.uid)?.attendanceCount ?? 0,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      change: "نشط",
      changeType: "positive" as const,
    },
    {
      title: "معدل التفاعل",
      value: `${analytics?.engagementRate ?? 0}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      change: analytics?.engagementRateChange ? `${analytics.engagementRateChange >= 0 ? '+' : ''}${analytics.engagementRateChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.engagementRateChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
  ]

  // Admin view stats
  const adminStatCards = [
    {
      title: "إجمالي المخدومين",
      value: analytics?.totalMembers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      change: analytics?.totalMembersChange ? `${analytics.totalMembersChange >= 0 ? '+' : ''}${analytics.totalMembersChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.totalMembersChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
    {
      title: "معدل الحضور",
      value: `${analytics?.attendanceRate ?? 0}%`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      change: analytics?.attendanceRateChange ? `${analytics.attendanceRateChange >= 0 ? '+' : ''}${analytics.attendanceRateChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.attendanceRateChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
    {
      title: "المخدومين النشطون",
      value: analytics?.activeMembers ?? 0,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      change: analytics?.activeMembersChange ? `${analytics.activeMembersChange >= 0 ? '+' : ''}${analytics.activeMembersChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.activeMembersChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
    {
      title: "معدل التفاعل",
      value: `${analytics?.engagementRate ?? 0}%`,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      change: analytics?.engagementRateChange ? `${analytics.engagementRateChange >= 0 ? '+' : ''}${analytics.engagementRateChange.toFixed(1)}%` : "0%",
      changeType: (analytics?.engagementRateChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
    },
  ]

  if (loading || loadingDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (dashboardData?.showMemberActions) {
    // Member view
    return (
      <motion.div
        className="p-6 space-y-6 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="space-y-2">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">مرحباً، {user?.displayName}</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">إحصائياتي الشخصية</p>
          </div>
        </motion.div>

        {/* Member Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {memberStatCards.map((stat: any, index: number) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                custom={{ isMobile, index }}
                variants={cardVariants}
                transition={{ duration: isMobile ? 0.7 : 0.5 }}
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
                          {stat.change} من الفترة السابقة
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <Card glassy>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">تسجيل الحضور</h3>
              <Button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white mx-auto"
                size="lg"
              >
                <QrCode className="w-6 h-6" />
                {showQR ? "إخفاء رمز QR" : "إظهار رمز QR"}
              </Button>

              {showQR && (
                <div className="mt-4 bg-white p-4 rounded-lg inline-block mx-auto">
                  <QRCode
                    value={JSON.stringify({
                      memberId: user?.uid,
                      timestamp: Date.now(),
                    })}
                    size={180}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card glassy className={cn(isMobile && "fixed bottom-0 left-0 right-0 rounded-none z-10")}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">الإجراءات السريعة</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/profile"}
                >
                  الملف الشخصي
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/gallery"}
                >
                  معرض الصور
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/posts"}
                >
                  البوستات
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/settings"}
                >
                  الإعدادات
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/about"}
                >
                  عن البرنامج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4"]

  return (
    <div className="p-6 space-y-6 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مرحباً، {user?.displayName}</h1>
            <p className="text-gray-600 dark:text-gray-400">لوحة تحليلات النسور</p>
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
        {dashboardData?.stats?.map((stat: any, index: number) => {
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
                        {stat.change} من الفترة السابقة
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
          <TabsTrigger value="members">المخدومين</TabsTrigger>
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
                  <AreaChart data={analytics?.attendanceTrend}>
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
                  <BarChart data={analytics?.weeklyAttendance}>
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
                {analytics?.memberAttendanceStats && analytics.memberAttendanceStats.length > 0 ? (
                  analytics.memberAttendanceStats.slice(0, 10).map((member, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>لا توجد بيانات حضور متاحة</p>
                    <p className="text-sm mt-2">سيتم عرض إحصائيات الحضور بعد أول اجتماع</p>
                  </div>
                )}
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
                  توزيع المخدومين حسب المرحلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.membersByStage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ stage, count }) => `${stage}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.membersByStage.map((entry, index) => (
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
                  نمو المخدومين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [value, name === "total" ? "إجمالي المخدومين" : "مخدومين جدد"]} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="إجمالي المخدومين" />
                    <Line type="monotone" dataKey="new" stroke="#10B981" strokeWidth={2} name="مخدومين جدد" />
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
                  <BarChart data={analytics?.monthlyPosts}>
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
                  {analytics?.postEngagement && analytics.postEngagement.length > 0 ? (
                    analytics.postEngagement.slice(0, 5).map((post, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>لا توجد منشورات متاحة</p>
                      <p className="text-sm mt-2">سيتم عرض إحصائيات التفاعل بعد نشر أول منشور</p>
                    </div>
                  )}
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
                {analytics?.meetingStats && analytics.meetingStats.length > 0 ? (
                  analytics.meetingStats.slice(0, 10).map((meeting, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>لا توجد اجتماعات متاحة</p>
                    <p className="text-sm mt-2">سيتم عرض إحصائيات الأداء بعد أول اجتماع</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dashboardData?.showAdminActions && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card glassy>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => window.location.href = "/members"}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">إضافة مخدوم جديد</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إضافة مخدوم جديد إلى الخدمة</p>
                </button>

                <button
                  type="button"
                  className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => window.location.href = "/attendance"}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">تسجيل الحضور</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تسجيل حضور الاجتماع الحالي</p>
                </button>

                <button
                  type="button"
                  className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => window.location.href = "/notifications"}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">إرسال إشعار</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إرسال إشعار لجميع المخدومين</p>
                </button>

                <button
                  type="button"
                  className="p-4 text-right rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => window.location.href = "/admin/meeting-generator"}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">إنشاء اجتماعات</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إنشاء اجتماعات الجمعة الأسبوعية</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
