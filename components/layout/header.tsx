"use client"

import { Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import { logout } from "@/lib/auth"
import { t } from "@/lib/translations"
import Image from "next/image"

export function Header() {
  const { user, role } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-3 space-x-reverse">
            {user?.photoURL ? (
              <Image
                src={user.photoURL || "/placeholder.svg"}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}

            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{user?.displayName}</p>
              <p className="text-gray-500 dark:text-gray-400">{t(role || "member")}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
