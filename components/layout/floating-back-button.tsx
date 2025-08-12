"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface FloatingBackButtonProps {
  show?: boolean
}

export function FloatingBackButton({ show = true }: FloatingBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard")
    }
  }

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-20 left-4 z-40 lg:hidden"
    >
      <Button
        onClick={handleBack}
        size="sm"
        className="rounded-full shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
