import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"
import { OfflineDetector } from "@/components/error/offline-detector"
import { InstallPrompt } from "@/components/pwa/install-prompt"

export const metadata: Metadata = {
  title: "خدمة الشباب - إدارة الحضور والمشاركة",
  description: "تطبيق إدارة حضور ومشاركة الشباب في الكنيسة",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "خدمة الشباب",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="rtl">
      <body className="font-arabic">
        <Providers>
          {children}
          <OfflineDetector />
          <InstallPrompt />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                fontFamily: "Cairo, sans-serif",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
