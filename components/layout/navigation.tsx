"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Users, Calendar, Bell, FileText, BookOpen, BarChart3, Settings, Menu, X } from "lucide-react"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/translations"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/dashboard", icon: Home, label: "dashboard" },
  { href: "/members", icon: Users, label: "members" },
  { href: "/attendance", icon: Calendar, label: "attendance" },
  { href: "/notifications", icon: Bell, label: "notifications", adminOnly: true },
  { href: "/posts", icon: FileText, label: "posts" },
  { href: "/daily-quotes", icon: BookOpen, label: "dailyQuotes" },
  { href: "/analytics", icon: BarChart3, label: "analytics", adminOnly: true },
  { href: "/settings", icon: Settings, label: "settings" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { role } = useAuth()

  const filteredItems = navigationItems.filter((item) => !item.adminOnly || role === "admin")

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="bg-white/90 backdrop-blur-sm">
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen || window.innerWidth >= 1024 ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-lg lg:relative lg:translate-x-0",
          isOpen && "translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">خدمة الشباب</h2>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  )}
                >
                  <Icon className="w-5 h-5 ml-3" />
                  {t(item.label)}
                </Link>
              )
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
