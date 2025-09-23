"use client"

import { ChevronLeft, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { t } from "@/lib/translations"

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: t("dashboard"), href: "/dashboard" }]

    let currentPath = ""

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Skip dashboard as it's already added
      if (segment === "dashboard") return

      let label = segment

      // Map path segments to Arabic labels
      const segmentMap: Record<string, string> = {
        members: t("members"),
        attendance: t("attendance"),
        posts: t("posts"),
        notifications: t("notifications"),
        gallery: t("gallery"),
        settings: t("settings"),
        profile: t("profile"),
        about: t("about"),
      }

      if (segmentMap[segment]) {
        label = segmentMap[segment]
      } else if (index === pathSegments.length - 1) {
        // For dynamic routes like /members/[id], show a generic label
        const parentSegment = pathSegments[index - 1]
        if (parentSegment === "members") {
          label = "تفاصيل المخدوم"
        }
      }

      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on dashboard or auth or profile/complete
  if (pathname === "/dashboard" || pathname === "/auth" || pathname === "/profile/complete") {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 px-4 sm:px-6 mt-4">
      <Home className="w-4 h-4 mt-4 pt-4" />
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center gap-2">
          {index > 0 && <ChevronLeft className="w-4 h-4" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">{breadcrumb.label}</span>
          ) : (
            <Link href={breadcrumb.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
