"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Palette, Bell, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/app/providers_old"
import { useTheme } from "@/components/theme-provider"
import { t } from "@/lib/translations"
import type { UserSettings } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RoleGuard } from "@/components/auth/role-guard"
import toast from "react-hot-toast"

const colorOptions = [
  { name: "أزرق", value: "#0ea5e9" },
  { name: "أخضر", value: "#10b981" },
  { name: "بنفسجي", value: "#8b5cf6" },
  { name: "أحمر", value: "#ef4444" },
  { name: "برتقالي", value: "#f97316" },
  { name: "وردي", value: "#ec4899" },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState<UserSettings>({
    userId: user?.uid || "",
    theme: "light",
    primaryColor: "#0ea5e9",
    notifications: {
      push: true,
      email: false,
    },
    meetingSchedule: { dayOfWeek: 0, startTime: "", endTime: "" }, // Add default value for meetingSchedule
    updatedAt: new Date(),
  })

  const [appSettings, setAppSettings] = useState({
    allowNewRegistrations: true,
    dailyVersesEnabled: true,
    autoAttendanceReminders: true,
    requireApprovalForPosts: false,
  })

  useEffect(() => {
    // Simulate loading user settings
    setTimeout(() => {
      setSettings({
        userId: user?.uid || "",
        theme: theme,
        primaryColor: primaryColor,
        notifications: {
          push: true,
          email: false,
        },
        meetingSchedule: { dayOfWeek: 0, startTime: "", endTime: "" }, // Add default value for meetingSchedule
        updatedAt: new Date(),
      })
      setLoading(false)
    }, 1000)
  }, [user, theme, primaryColor])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Update theme and color
      setTheme(settings.theme)
      setPrimaryColor(settings.primaryColor)

      // In real app, save to Firestore
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("تم حفظ الإعدادات بنجاح")
    } catch (error) {
      toast.error("حدث خطأ في حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setSettings({ ...settings, theme: newTheme })
  }

  const handleColorChange = (color: string) => {
    setSettings({ ...settings, primaryColor: color })
  }



  const handleNotificationChange = (field: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    })
  }

  const handleAppSettingChange = (field: string, value: boolean) => {
    setAppSettings({
      ...appSettings,
      [field]: value,
    })
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
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("settings")}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">إعدادات النظام والتخصيص</p>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="w-4 h-4 ml-2" />
            {saving ? "جاري الحفظ..." : t("save")}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Settings */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t("themeSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>وضع العرض</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={settings.theme === "light" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleThemeChange("light")}
                      className="flex-1"
                    >
                      {t("lightMode")}
                    </Button>
                    <Button
                      variant={settings.theme === "dark" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleThemeChange("dark")}
                      className="flex-1"
                    >
                      {t("darkMode")}
                    </Button>
                    <Button
                      variant={settings.theme === "system" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleThemeChange("system")}
                      className="flex-1"
                    >
                      تلقائي
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>{t("primaryColor")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${settings.primaryColor === color.value
                          ? "border-gray-900 dark:border-white"
                          : "border-gray-200 dark:border-gray-700"
                          }`}
                      >
                        <div className="w-full h-8 rounded-md" style={{ backgroundColor: color.value }} />
                        <p className="text-xs mt-2">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>



          {/* Notification Settings */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الإشعارات الفورية</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إشعارات المتصفح والهاتف</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تلقي الإشعارات عبر البريد</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>الآيات اليومية</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إرسال آية يومية تلقائياً</p>
                  </div>
                  <Switch
                    checked={appSettings.dailyVersesEnabled}
                    onCheckedChange={(checked) => handleAppSettingChange("dailyVersesEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  إعدادات التطبيق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>السماح بالتسجيل الجديد</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">السماح للمستخدمين الجدد بالتسجيل</p>
                  </div>
                  <Switch
                    checked={appSettings.allowNewRegistrations}
                    onCheckedChange={(checked) => handleAppSettingChange("allowNewRegistrations", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تذكير الحضور التلقائي</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إرسال تذكير قبل الاجتماع</p>
                  </div>
                  <Switch
                    checked={appSettings.autoAttendanceReminders}
                    onCheckedChange={(checked) => handleAppSettingChange("autoAttendanceReminders", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>مراجعة المنشورات</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تتطلب موافقة الخادم قبل النشر</p>
                  </div>
                  <Switch
                    checked={appSettings.requireApprovalForPosts}
                    onCheckedChange={(checked) => handleAppSettingChange("requireApprovalForPosts", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Settings */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card glassy>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>معرف المستخدم</Label>
                  <Input value={user?.uid || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                </div>

                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Input value={t("admin")} disabled className="bg-gray-50 dark:bg-gray-800" />
                </div>

                <div className="space-y-2">
                  <Label>آخر تحديث</Label>
                  <Input
                    value={settings.updatedAt.toLocaleString("ar-EG")}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.reload()}>
                    إعادة تحميل التطبيق
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => {
                    // TODO: Implement export settings functionality
                    toast("سيتم تنفيذ تصدير الإعدادات قريباً")
                  }}>
                    تصدير الإعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  )
}
