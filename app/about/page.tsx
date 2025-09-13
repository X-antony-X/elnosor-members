"use client"

import { motion } from "framer-motion"
import { Heart, Users, MessageCircle, Phone, Mail, ExternalLink, Star, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { t } from "@/lib/translations"
import Link from "next/link"

const servants = [
  {
    name: "أبونا فلان",
    role: "كاهن الكنيسة",
    phone: "01234567890",
    email: "abouna.youssef@church.org",
  },
  {
    name: "فلان الفولاني",
    role: "رئيس خدمة الشباب",
    phone: "01123456789",
    email: "folanElfolany@church.org",
  },
  {
    name: "علان العلاني",
    role: "مسؤولة الأنشطة",
    phone: "01098765432",
    email: "folanElfolany@church.org",
  },
]

const groupChats = [
  {
    name: "مجموعة الشباب الرئيسية",
    platform: "WhatsApp0",
    link: "https://chat.whatsapp.com/example1",
    members: 251,
  },
  {
    name: "جروب الفيسبوك",
    platform: "Facebook0",
    link: "https://www.facebook.com/share/g/16tMybk81j/?mibextid=NSMWBT",
    members: 232,
  },
  {
    name: "المنارة يوتيوب",
    platform: "youtube1",
    link: "https://youtube.com/@al-manarateam?si=58nLHe3xHD3bo2zJ",
    members: 225,
  },
  // {
  //   name: "المنارة كوبتك",
  //   platform: "Coptok1",
  //   link: "https://coptok.page.link/xKGgze1VHvtHJ1Hw9",
  //   members: 0,
  // },
  {
    name: "المنارة انستجرام",
    platform: "Instagram1",
    link: "https://www.instagram.com/al.manarateam.ch?utm_source=qr&igsh=ZnRwMjRvcnBjazQ0",
    members: 812,
  },
  {
    name: "المنارة ثريد",
    platform: "Threads1",
    link: "https://www.threads.net/@al.manarateam.ch",
    members: 1,
  },
  {
    name: "المنارة تيكتوك",
    platform: "TicTok1",
    link: "https://www.tiktok.com/@almanara.team.ch?_t=ZS-8ua5KYVvtaM&_r=1",
    members: 2971,
  },
  // {
  //   name: "المنارة تويتر",
  //   platform: "X1",
  //   link: "https://x.com/ManaraTeam?t=CWno__QK5fqNEDy93lFoLQ&s=09",
  //   members: 0,
  // },
  {
    name: "المنارة واتساب",
    platform: "Whatsapp1",
    link: "https://whatsapp.com/channel/0029Vb8nliYAzNc2r4c0280o",
    members: 44,
  },
  {
    name: "المنارة ساوندكلاود",
    platform: "SoundCloud1",
    link: "https://on.soundcloud.com/4vq5qMtRUEvoFRqk8",
    members: 5,
  },
  {
    name: "المنارة تلجرام",
    platform: "Telegram1",
    link: "https://t.me/Almanarateamch",
    members: 4,
  },
]

const features = [
  {
    icon: Users,
    title: "إدارة الأعضاء",
    description: "تتبع معلومات الأعضاء وبياناتهم الشخصية",
  },
  {
    icon: Calendar,
    title: "تسجيل الحضور",
    description: "نظام متطور لتسجيل الحضور والغياب",
  },
  {
    icon: MessageCircle,
    title: "التواصل والإشعارات",
    description: "إرسال الإشعارات والرسائل للأعضاء",
  },
  {
    icon: Star,
    title: "المحتوى اليومي",
    description: "آيات وأقوال يومية للتأمل والنمو الروحي",
  },
]

export default function AboutPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.75, y: 0 }} className="text-center space-y-4">
        <Card>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("about")}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t("appDescription")} - منصة شاملة لإدارة خدمة الشباب والتفاعل مع الأعضاء
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Features */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">مميزات التطبيق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Group Chats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t("groupChats")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupChats.map((group, index) => (
              <motion.div
                key={group.name + index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{group.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.platform} • {group.members} عضو
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={group.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    انضمام
                  </Link>
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Servants */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("contactServants")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {servants.map((servant, index) => (
              <motion.div
                key={servant.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{servant.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{servant.role}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <Link
                            href={`tel:${servant.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {servant.phone}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <Link
                            href={`mailto:${servant.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {servant.email}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {index < servants.length - 1 && <Separator className="my-4" />}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-4 py-8"
      >
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>تطبيق خدمة الشباب - الإصدار 1.0.6</p>
          <p>تم التطوير بحب لخدمة الكنيسة</p>
          <p className="mt-2">© 2025 جميع الحقوق محفوظة للنسور</p>
        </div>
      </motion.div>
    </div>
  )
}
