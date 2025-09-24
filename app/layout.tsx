import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"
import { OfflineDetector } from "@/components/error/offline-detector"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { HydrationSafe } from "@/components/hydration-safe"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERSEL_URL_FULL || 'http://localhost:3000'),
  title: "Shabab Alnosor",
  description: "تطبيق إدارة حضور ومشاركة الشباب في الكنيسة",
  manifest: "/manifest.json",
  authors: [{ name: 'Peter Eshak Abdo', url: process.env.VERSEL_URL_FULL }],
  creator: 'Peter Eshak Abdo',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "خدمة الشباب",
  },
  icons: {
    icon: "/icons/android/android-launchericon-192-192.png",
    apple: "/icons/ios/192.png",
  },
  generator: 'Tofa7a',
  openGraph: {
    title: 'شباب النسور',
    description: "تطبيق إدارة حضور ومشاركة الشباب في الكنيسة",
    url: process.env.VERSEL_URL_FULL,
    siteName: 'Elnosor Members',
    // images: [
    //   {
    //     url: '/images/icons/favicon.ico',
    //     width: 1200,
    //     height: 630,
    //     alt: 'أبونا فلتاؤس السرياني',
    //   },
    // ],
    locale: 'ar_EG',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },

}

export function generateViewport() {
  return {
    themeColor: "#0ea5e9",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="rtl">
      <body className="font-arabic" suppressHydrationWarning={true}>
        <div className="background-blur" />
        <HydrationSafe>
          <Providers>
            <>
              <Breadcrumbs />
              {children}
              <OfflineDetector />
              <InstallPrompt />
            </>
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
        </HydrationSafe>
      </body>
    </html>
  )
}
