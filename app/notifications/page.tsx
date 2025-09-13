"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Send,
  Clock,
  Users,
  User,
  Edit,
  Trash2,
  Repeat,
  BookTemplate as Template,
  BarChart3,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type {
  Notification,
  DailyQuote,
  NotificationTemplate,
  RecurringPattern,
  NotificationSchedule,
} from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function NotificationsPage() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([])
  const [dailyQuotes, setDailyQuotes] = useState<DailyQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyVersesEnabled, setDailyVersesEnabled] = useState(true)

  // Form states
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    targetAudience: "all" as "all" | "group" | "individuals",
    scheduledTime: "",
    imageUrl: "",
    priority: "normal" as "low" | "normal" | "high",
    isRecurring: false,
    recurringPattern: {
      type: "weekly" as "daily" | "weekly" | "monthly" | "yearly",
      interval: 1,
      daysOfWeek: [] as number[],
      endDate: "",
    },
  })

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    message: "",
    category: "announcement" as "meeting" | "announcement" | "reminder" | "verse" | "custom",
    targetAudience: "all" as "all" | "group" | "individuals",
  })

  const [bulkSchedule, setBulkSchedule] = useState({
    templateId: "",
    dates: [] as string[],
    targetAudience: "all" as "all" | "group" | "individuals",
  })

  useEffect(() => {
    if (role === "member") {
      // Members can only view notifications, redirect to read-only view
    }
  }, [role])

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setNotifications([
        {
          id: "1",
          title: "اجتماع الشباب غداً",
          message: "لا تنسوا اجتماع الشباب غداً الجمعة الساعة 7 مساءً",
          targetAudience: "all",
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          sentTime: undefined,
          createdBy: user?.uid || "admin",
          createdAt: new Date(),
          readBy: ["user1", "user2"],
          priority: "high",
          isRecurring: true,
          recurringPattern: {
            type: "weekly",
            interval: 1,
            daysOfWeek: [5], // Friday
          },
        },
        {
          id: "2",
          title: "آية اليوم",
          message: "في البدء كان الكلمة، والكلمة كان عند الله، وكان الكلمة الله - يوحنا 1:1",
          targetAudience: "all",
          sentTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdBy: "system",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          readBy: ["user1", "user2", "user3"],
          priority: "normal",
          templateId: "daily-verse",
        },
      ])

      setTemplates([
        {
          id: "1",
          name: "تذكير اجتماع الشباب",
          title: "اجتماع الشباب {date}",
          message: "لا تنسوا اجتماع الشباب {date} الساعة {time}",
          category: "meeting",
          targetAudience: "all",
          variables: ["date", "time"],
          createdBy: user?.uid || "admin",
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: "2",
          name: "آية يومية",
          title: "آية اليوم",
          message: "{verse} - {reference}",
          category: "verse",
          targetAudience: "all",
          variables: ["verse", "reference"],
          createdBy: "system",
          createdAt: new Date(),
          isActive: true,
        },
      ])

      setSchedules([
        {
          id: "1",
          templateId: "1",
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          targetAudience: "all",
          variables: {
            date: "غداً الجمعة",
            time: "7 مساءً",
          },
          isActive: true,
          createdBy: user?.uid || "admin",
          createdAt: new Date(),
          nextSend: new Date(Date.now() + 24 * 60 * 60 * 1000),
          recurringPattern: {
            type: "weekly",
            interval: 1,
            daysOfWeek: [4], // Thursday (day before meeting)
          },
        },
      ])

      setDailyQuotes([
        {
          id: "1",
          type: "youth",
          dayOfYear: new Date().getDate(),
          quote: "في البدء كان الكلمة، والكلمة كان عند الله، وكان الكلمة الله",
          author: "يوحنا الإنجيلي",
          reference: "يوحنا 1:1",
          createdAt: new Date(),
        },
        {
          id: "2",
          type: "fathers",
          dayOfYear: new Date().getDate(),
          quote: "الصلاة هي تنفس الروح",
          author: "القديس يوحنا ذهبي الفم",
          reference: "",
          createdAt: new Date(),
        },
      ])

      setLoading(false)
    }, 1000)
  }, [user])

  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) return

    const notification: Notification = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      targetAudience: newNotification.targetAudience,
      scheduledTime: newNotification.scheduledTime ? new Date(newNotification.scheduledTime) : undefined,
      priority: newNotification.priority,
      isRecurring: newNotification.isRecurring,
      recurringPattern: newNotification.isRecurring
        ? {
            type: newNotification.recurringPattern.type,
            interval: newNotification.recurringPattern.interval,
            daysOfWeek: newNotification.recurringPattern.daysOfWeek,
            endDate: newNotification.recurringPattern.endDate
              ? new Date(newNotification.recurringPattern.endDate)
              : undefined,
          }
        : undefined,
      createdBy: user?.uid || "admin",
      createdAt: new Date(),
      readBy: [],
    }

    setNotifications([notification, ...notifications])
    setNewNotification({
      title: "",
      message: "",
      targetAudience: "all",
      scheduledTime: "",
      imageUrl: "",
      priority: "normal",
      isRecurring: false,
      recurringPattern: {
        type: "weekly",
        interval: 1,
        daysOfWeek: [],
        endDate: "",
      },
    })
    toast.success("تم إنشاء الإشعار بنجاح")
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.title.trim() || !newTemplate.message.trim()) return

    const template: NotificationTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      title: newTemplate.title,
      message: newTemplate.message,
      category: newTemplate.category,
      targetAudience: newTemplate.targetAudience,
      variables: extractVariables(newTemplate.title + " " + newTemplate.message),
      createdBy: user?.uid || "admin",
      createdAt: new Date(),
      isActive: true,
    }

    setTemplates([template, ...templates])
    setNewTemplate({
      name: "",
      title: "",
      message: "",
      category: "announcement",
      targetAudience: "all",
    })
    toast.success("تم إنشاء القالب بنجاح")
  }

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g)
    return matches ? matches.map((match) => match.slice(1, -1)) : []
  }

  const handleBulkSchedule = async () => {
    if (!bulkSchedule.templateId || bulkSchedule.dates.length === 0) return

    const template = templates.find((t) => t.id === bulkSchedule.templateId)
    if (!template) return

    const newSchedules = bulkSchedule.dates.map((date) => ({
      id: `${Date.now()}-${Math.random()}`,
      templateId: bulkSchedule.templateId,
      scheduledTime: new Date(date),
      targetAudience: bulkSchedule.targetAudience,
      variables: {},
      isActive: true,
      createdBy: user?.uid || "admin",
      createdAt: new Date(),
      nextSend: new Date(date),
    }))

    setSchedules([...schedules, ...newSchedules])
    setBulkSchedule({
      templateId: "",
      dates: [],
      targetAudience: "all",
    })
    toast.success(`تم جدولة ${newSchedules.length} إشعار بنجاح`)
  }

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId))
    toast.success("تم حذف الإشعار")
  }

  const handleDeleteTemplate = async (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
    toast.success("تم حذف القالب")
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    setSchedules(schedules.filter((s) => s.id !== scheduleId))
    toast.success("تم حذف الجدولة")
  }

  const toggleDailyVerses = async () => {
    setDailyVersesEnabled(!dailyVersesEnabled)
    toast.success(dailyVersesEnabled ? "تم إيقاف الآيات اليومية" : "تم تفعيل الآيات اليومية")
  }

  const getTodaysQuote = (type: "youth" | "fathers") => {
    const today = new Date().getDate()
    return dailyQuotes.find((quote) => quote.type === type && quote.dayOfYear === today)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100"
      case "low":
        return "text-gray-600 bg-gray-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  const getRecurringText = (pattern?: RecurringPattern) => {
    if (!pattern) return ""

    switch (pattern.type) {
      case "daily":
        return pattern.interval === 1 ? "يومياً" : `كل ${pattern.interval} أيام`
      case "weekly":
        return pattern.interval === 1 ? "أسبوعياً" : `كل ${pattern.interval} أسابيع`
      case "monthly":
        return pattern.interval === 1 ? "شهرياً" : `كل ${pattern.interval} شهور`
      case "yearly":
        return pattern.interval === 1 ? "سنوياً" : `كل ${pattern.interval} سنوات`
      default:
        return ""
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
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("notifications")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {role === "admin" ? "إدارة الإشعارات والجدولة المتقدمة" : "الإشعارات والآيات اليومية"}
          </p>
        </div>

        {role === "admin" && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Template className="w-4 h-4 ml-2" />
                  قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إنشاء قالب إشعار</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="اسم القالب"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                  <Input
                    placeholder="عنوان الإشعار (استخدم {متغير} للمتغيرات)"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="نص الإشعار (استخدم {متغير} للمتغيرات)"
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    rows={3}
                  />
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value: any) => setNewTemplate({ ...newTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="فئة القالب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">اجتماع</SelectItem>
                      <SelectItem value="announcement">إعلان</SelectItem>
                      <SelectItem value="reminder">تذكير</SelectItem>
                      <SelectItem value="verse">آية</SelectItem>
                      <SelectItem value="custom">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewTemplate({
                          name: "",
                          title: "",
                          message: "",
                          category: "announcement",
                          targetAudience: "all",
                        })
                      }
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim()}>
                      إنشاء القالب
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  {t("sendNotification")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("sendNotification")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={t("notificationTitle")}
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  />
                  <Textarea
                    placeholder={t("notificationMessage")}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={newNotification.targetAudience}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, targetAudience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("targetAudience")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all")}</SelectItem>
                        <SelectItem value="group">{t("group")}</SelectItem>
                        <SelectItem value="individuals">{t("individuals")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newNotification.priority}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="normal">عادية</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="datetime-local"
                    placeholder="وقت الإرسال (اختياري)"
                    value={newNotification.scheduledTime}
                    onChange={(e) => setNewNotification({ ...newNotification, scheduledTime: e.target.value })}
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={newNotification.isRecurring}
                      onCheckedChange={(checked) => setNewNotification({ ...newNotification, isRecurring: !!checked })}
                    />
                    <Label htmlFor="recurring">إشعار متكرر</Label>
                  </div>

                  {newNotification.isRecurring && (
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          value={newNotification.recurringPattern.type}
                          onValueChange={(value: any) =>
                            setNewNotification({
                              ...newNotification,
                              recurringPattern: { ...newNotification.recurringPattern, type: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="نوع التكرار" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">يومي</SelectItem>
                            <SelectItem value="weekly">أسبوعي</SelectItem>
                            <SelectItem value="monthly">شهري</SelectItem>
                            <SelectItem value="yearly">سنوي</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          placeholder="كل كم..."
                          value={newNotification.recurringPattern.interval}
                          onChange={(e) =>
                            setNewNotification({
                              ...newNotification,
                              recurringPattern: {
                                ...newNotification.recurringPattern,
                                interval: Number.parseInt(e.target.value) || 1,
                              },
                            })
                          }
                        />
                      </div>

                      {newNotification.recurringPattern.type === "weekly" && (
                        <div>
                          <Label className="text-sm font-medium">أيام الأسبوع:</Label>
                          <div className="flex gap-2 mt-2">
                            {["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map((day, index) => (
                              <div key={index} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`day-${index}`}
                                  checked={newNotification.recurringPattern.daysOfWeek.includes(index)}
                                  onCheckedChange={(checked) => {
                                    const days = newNotification.recurringPattern.daysOfWeek
                                    const newDays = checked ? [...days, index] : days.filter((d) => d !== index)
                                    setNewNotification({
                                      ...newNotification,
                                      recurringPattern: { ...newNotification.recurringPattern, daysOfWeek: newDays },
                                    })
                                  }}
                                />
                                <Label htmlFor={`day-${index}`} className="text-xs">
                                  {day}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Input
                        type="date"
                        placeholder="تاريخ الانتهاء (اختياري)"
                        value={newNotification.recurringPattern.endDate}
                        onChange={(e) =>
                          setNewNotification({
                            ...newNotification,
                            recurringPattern: { ...newNotification.recurringPattern, endDate: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewNotification({
                          title: "",
                          message: "",
                          targetAudience: "all",
                          scheduledTime: "",
                          imageUrl: "",
                          priority: "normal",
                          isRecurring: false,
                          recurringPattern: { type: "weekly", interval: 1, daysOfWeek: [], endDate: "" },
                        })
                      }
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      onClick={handleSendNotification}
                      disabled={!newNotification.title.trim() || !newNotification.message.trim()}
                    >
                      <Send className="w-4 h-4 ml-2" />
                      {newNotification.scheduledTime ? "جدولة" : "إرسال"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </motion.div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="schedules">الجدولة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="daily-verses">الآيات اليومية</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glassy>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                          {notification.targetAudience === "all" ? (
                            <Users className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {notification.title}
                            {notification.priority && (
                              <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                {notification.priority === "high"
                                  ? "عالية"
                                  : notification.priority === "low"
                                    ? "منخفضة"
                                    : "عادية"}
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {notification.sentTime ? (
                              <Badge variant="secondary">تم الإرسال</Badge>
                            ) : notification.scheduledTime ? (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 ml-1" />
                                مجدول
                              </Badge>
                            ) : (
                              <Badge variant="destructive">مسودة</Badge>
                            )}
                            {notification.isRecurring && (
                              <Badge variant="outline">
                                <Repeat className="w-3 h-3 ml-1" />
                                {getRecurringText(notification.recurringPattern)}
                              </Badge>
                            )}
                            {notification.templateId && (
                              <Badge variant="outline">
                                <Template className="w-3 h-3 ml-1" />
                                قالب
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">{notification.readBy?.length || 0} قراءة</span>
                          </div>
                        </div>
                      </div>

                      {role === "admin" && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notification.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                    {notification.imageUrl && (
                      <img
                        src={notification.imageUrl || "/placeholder.svg"}
                        alt="Notification"
                        className="rounded-lg max-h-48 object-cover"
                      />
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                      <span>
                        {notification.sentTime
                          ? `تم الإرسال: ${notification.sentTime.toLocaleString("ar-EG")}`
                          : notification.scheduledTime
                            ? `مجدول: ${notification.scheduledTime.toLocaleString("ar-EG")}`
                            : `تم الإنشاء: ${notification.createdAt.toLocaleString("ar-EG")}`}
                      </span>
                      <Badge variant="outline">{t(notification.targetAudience)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {notifications.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">لا توجد إشعارات</p>
                {role === "admin" && <p className="text-sm text-gray-400 mt-2">ابدأ بإرسال أول إشعار للأعضاء</p>}
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {role === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card glassy>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{template.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{template.message}</p>
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.map((variable, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          {role === "admin" && (
            <>
              <Card glassy>
                <CardHeader>
                  <CardTitle>جدولة مجمعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={bulkSchedule.templateId}
                    onValueChange={(value) => setBulkSchedule({ ...bulkSchedule, templateId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id!}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <Label>التواريخ (أضف عدة تواريخ):</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="datetime-local"
                        onChange={(e) => {
                          if (e.target.value && !bulkSchedule.dates.includes(e.target.value)) {
                            setBulkSchedule({
                              ...bulkSchedule,
                              dates: [...bulkSchedule.dates, e.target.value],
                            })
                          }
                        }}
                      />
                      <Button
                        onClick={handleBulkSchedule}
                        disabled={!bulkSchedule.templateId || bulkSchedule.dates.length === 0}
                      >
                        جدولة ({bulkSchedule.dates.length})
                      </Button>
                    </div>
                    {bulkSchedule.dates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bulkSchedule.dates.map((date, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {new Date(date).toLocaleString("ar-EG")}
                            <button
                              type="button"
                              onClick={() =>
                                setBulkSchedule({
                                  ...bulkSchedule,
                                  dates: bulkSchedule.dates.filter((_, index) => index !== i),
                                })
                              }
                              className="mr-1 text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {schedules.map((schedule, index) => {
                  const template = templates.find((t) => t.id === schedule.templateId)
                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card glassy>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{template?.name || "قالب محذوف"}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                مجدول: {schedule.scheduledTime.toLocaleString("ar-EG")}
                              </p>
                              {schedule.recurringPattern && (
                                <Badge variant="outline" className="mt-1">
                                  <Repeat className="w-3 h-3 ml-1" />
                                  {getRecurringText(schedule.recurringPattern)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Switch
                                checked={schedule.isActive}
                                onCheckedChange={(checked) => {
                                  setSchedules(
                                    schedules.map((s) => (s.id === schedule.id ? { ...s, isActive: checked } : s)),
                                  )
                                }}
                              />
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(schedule.id!)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  إحصائيات الإرسال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>إجمالي الإشعارات:</span>
                    <span className="font-bold">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تم الإرسال:</span>
                    <span className="font-bold text-green-600">{notifications.filter((n) => n.sentTime).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مجدولة:</span>
                    <span className="font-bold text-blue-600">
                      {notifications.filter((n) => n.scheduledTime && !n.sentTime).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card glassy>
              <CardHeader>
                <CardTitle>معدل القراءة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {notifications.length > 0
                      ? Math.round(
                          notifications.reduce((acc, n) => acc + (n.readBy?.length || 0), 0) / notifications.length,
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">متوسط معدل القراءة</p>
                </div>
              </CardContent>
            </Card>

            <Card glassy>
              <CardHeader>
                <CardTitle>القوالب النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{templates.filter((t) => t.isActive).length}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">من أصل {templates.length} قالب</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily-verses" className="space-y-6">
          {/* ... existing daily verses code ... */}
          {role === "admin" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card glassy>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    إعدادات الآيات اليومية
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal">{dailyVersesEnabled ? "مفعل" : "متوقف"}</span>
                      <Switch checked={dailyVersesEnabled} onCheckedChange={toggleDailyVerses} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {dailyVersesEnabled
                      ? "يتم إرسال الآيات اليومية تلقائياً كل صباح للأعضاء"
                      : "الآيات اليومية متوقفة حالياً"}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل المحتوى
                    </Button>
                    <Button variant="outline" size="sm">
                      إضافة آية جديدة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card glassy>
                <CardHeader>
                  <CardTitle className="text-blue-600">{t("youthQuotes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {getTodaysQuote("youth") ? (
                    <div className="space-y-3">
                      <p className="text-lg leading-relaxed">{getTodaysQuote("youth")!.quote}</p>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium">{getTodaysQuote("youth")!.author}</p>
                        {getTodaysQuote("youth")!.reference && <p>{getTodaysQuote("youth")!.reference}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">لا توجد آية لليوم</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card glassy>
                <CardHeader>
                  <CardTitle className="text-green-600">{t("fathersQuotes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {getTodaysQuote("fathers") ? (
                    <div className="space-y-3">
                      <p className="text-lg leading-relaxed">{getTodaysQuote("fathers")!.quote}</p>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium">{getTodaysQuote("fathers")!.author}</p>
                        {getTodaysQuote("fathers")!.reference && <p>{getTodaysQuote("fathers")!.reference}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">لا يوجد قول لليوم</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
