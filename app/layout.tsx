import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import type { Viewport } from "next"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "خدمة الشباب - إدارة الحضور والمشاركة",
  description: "تطبيق إدارة حضور ومشاركة الشباب في الكنيسة",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "خدمة الشباب",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="rtl" suppressHydrationWarning>
      <body className="font-arabic" suppressHydrationWarning>
        <Providers>
          {children}
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
