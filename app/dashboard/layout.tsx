"use client"

import type React from "react"
import { Navigation } from "@/components/layout/navigation"
import { Header } from "@/components/layout/header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Card } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen bg-white/10 dark:bg-black/10 backdrop-blur-sm">
      {!isMobile && <Navigation />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-lg m-4">
          <Card glassy className="h-full bg-transparent shadow-none border-none flex flex-col">
            <Breadcrumbs />
            {children}
            {isMobile && (
              <div className="mt-auto p-4 flex justify-center space-x-4 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-lg">
                {/* Glassy buttons at bottom for mobile */}
                <button className="px-4 py-2 bg-white/30 dark:bg-black/30 rounded-lg shadow-md hover:bg-white/50 dark:hover:bg-black/50 transition">
                  لوحة التحكم
                </button>
                <button className="px-4 py-2 bg-white/30 dark:bg-black/30 rounded-lg shadow-md hover:bg-white/50 dark:hover:bg-black/50 transition">
                  الملف الشخصي
                </button>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  )
}
