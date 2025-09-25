import type React from "react"
import { Navigation } from "@/components/layout/navigation"
import { Header } from "@/components/layout/header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Card } from "@/components/ui/card"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-lg m-4">
          <Card glassy className="h-full bg-transparent shadow-none border-none">
            <Breadcrumbs />
            {children}
          </Card>
        </main>
      </div>
    </div>
  )
}
