"use client"

import { Bell, LogOut, User, Menu, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import { logout } from "@/lib/auth"
import { t } from "@/lib/translations"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { OnlineStatusIndicator } from "@/components/error/offline-detector"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HeaderProps {
  onMenuToggle?: () => void
  showBackButton?: boolean
  title?: string
}

export function Header({ onMenuToggle, showBackButton = false, title }: HeaderProps) {
  const { user, role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [notificationCount] = useState(0) // Mock notification count

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard")
    }
  }

  const getPageTitle = () => {
    if (title) return title

    const pathMap: Record<string, string> = {
      "/dashboard": "لوحة التحكم",
      "/members": "الأعضاء",
      "/attendance": "الحضور",
      "/posts": "المنشورات",
      "/notifications": "الإشعارات",
      "/gallery": "المعرض",
      "/settings": "الإعدادات",
      "/profile": "ملفي الشخصي",
      "/about": "حول التطبيق",
    }

    return pathMap[pathname] || "شباب النسور"
  }

  return (
    <header className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg shadow-lg sticky top-0 z-40 border-b border-white/20 dark:border-black/20">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuToggle}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Back button for detailed pages */}
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-gray-600 dark:text-gray-400">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Animated logo */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base">نسور</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
              </div>
            </motion.div>

            {/* Mobile title */}
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-32">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right side - Actions and user info */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL || "/placeholder.svg"}
                  alt={user.displayName || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}

              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white truncate max-w-24">{user?.displayName}</p>
                <p className="text-gray-500 dark:text-gray-400">{t(role || "member")}</p>
              </div>
            </div>

            {/* User avatar - Mobile */}
            <div className="md:hidden">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL || "/placeholder.svg"}
                  alt={user.displayName || "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Logout button with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من أنك تريد تسجيل الخروج؟<br />
                    <br />
                    عند تسجيل الخروج، ستحتاج إلى إعادة المصادقة للوصول إلى التطبيق مرة أخرى. إليك الخطوات:
                    <br />
                    1. اضغط على "تسجيل الدخول بـ Google" أو "تسجيل الدخول بـ Facebook"
                    <br />
                    2. اختر حسابك من القائمة
                    <br />
                    3. أكمل إعداد ملفك الشخصي إذا لم يكن مكتملاً
                    <br />
                    <br />
                    سيتم تسجيل خروجك بالكامل وستحتاج إلى إعادة تسجيل الدخول.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    تأكيد تسجيل الخروج
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </header>
  )
}
