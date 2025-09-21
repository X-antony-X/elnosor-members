"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Users, Calendar, Bell, FileText, Settings, User, Info, X } from "lucide-react"
import { useAuth } from "@/app/providers_old"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/translations"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/dashboard", icon: Home, label: "dashboard" },
  { href: "/members", icon: Users, label: "members", adminOnly: true },
  { href: "/attendance", icon: Calendar, label: "attendance", adminOnly: true },
  { href: "/posts", icon: FileText, label: "posts", adminOnly: true },
  { href: "/notifications", icon: Bell, label: "notifications" },
  { href: "/settings", icon: Settings, label: "settings", adminOnly: true },
  { href: "/about", icon: Info, label: "about" },
]

const memberNavigationItems = [
  { href: "/dashboard", icon: Home, label: "dashboard" },
  { href: "/profile", icon: User, label: "profile" },
  { href: "/notifications", icon: Bell, label: "notifications" },
  { href: "/about", icon: Info, label: "about" },
]

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname()
  const { role } = useAuth()

  const items = role === "admin" ? navigationItems : memberNavigationItems

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Slide-out menu */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">خدمة الشباب</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role === "admin" ? "خادم" : "مخدوم"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation items */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                      )}
                    >
                      <Icon className="w-6 h-6 ml-3" />
                      {t(item.label)}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Bottom navigation for mobile (alternative approach)
export function BottomNavigation() {
  const pathname = usePathname()
  const { role } = useAuth()

  const items =
    role === "admin"
      ? [
        { href: "/dashboard", icon: Home, label: "الرئيسية" },
        { href: "/members", icon: Users, label: "الأعضاء" },
        { href: "/attendance", icon: Calendar, label: "الحضور" },
        { href: "/notifications", icon: Bell, label: "الإشعارات" },
      ]
      : [
        { href: "/dashboard", icon: Home, label: "الرئيسية" },
        { href: "/profile", icon: User, label: "ملفي" },
        { href: "/notifications", icon: Bell, label: "الإشعارات" },
        { href: "/about", icon: Info, label: "حول" },
      ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 lg:hidden">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
