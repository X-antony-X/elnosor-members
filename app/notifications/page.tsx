"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Send, Clock, Users, User, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import type { Notification, DailyQuote } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
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
  })

  useEffect(() => {
    if (role === "member") {
      // Members can only view notifications, redirect to read-only view
      // For now, we'll show the same page but with limited functionality
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
    })
  }

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId))
  }

  const toggleDailyVerses = async () => {
    setDailyVersesEnabled(!dailyVersesEnabled)
    // In real app, this would update the setting in Firestore
  }

  const getTodaysQuote = (type: "youth" | "fathers") => {
    const today = new Date().getDate()
    return dailyQuotes.find((quote) => quote.type === type && quote.dayOfYear === today)
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
            {role === "admin" ? "إدارة الإشعارات والآيات اليومية" : "الإشعارات والآيات اليومية"}
          </p>
        </div>

        {role === "admin" && (
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
                <Select
                  value={newNotification.targetAudience}
                  onValueChange={(value: "all" | "group" | "individuals") =>
                    setNewNotification({ ...newNotification, targetAudience: value })
                  }
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
                <Input
                  type="datetime-local"
                  placeholder="وقت الإرسال (اختياري)"
                  value={newNotification.scheduledTime}
                  onChange={(e) => setNewNotification({ ...newNotification, scheduledTime: e.target.value })}
                />
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="صورة (اختياري)"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNewNotification({ ...newNotification, imageUrl: URL.createObjectURL(file) })
                    }
                  }}
                />
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
        )}
      </motion.div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
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
                <Card>
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
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
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
                            <span className="text-sm text-gray-500">{notification.readBy?.length || 0} قراءة</span>
                          </div>
                        </div>
                      </div>

                      {role === "admin" && (
                        <div className="flex gap-2">
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

        <TabsContent value="daily-verses" className="space-y-6">
          {role === "admin" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
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
              <Card>
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
              <Card>
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
