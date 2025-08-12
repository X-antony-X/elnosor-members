"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      setShowOfflineMessage(false)
      window.location.reload()
    }
  }

  if (!showOfflineMessage) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4"
      >
        <Card className="bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <WifiOff className="w-4 h-4" />
              لا يوجد اتصال بالإنترنت
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
            <Button size="sm" variant="outline" onClick={handleRetry} className="w-full bg-transparent">
              <RefreshCw className="w-3 h-3 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Online status indicator component
export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center gap-1 text-xs">
      {isOnline ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
      <span className={isOnline ? "text-green-600" : "text-red-600"}>{isOnline ? "متصل" : "غير متصل"}</span>
    </div>
  )
}
