"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useOfflineStorage } from "@/hooks/use-offline-storage"

export function SyncStatus() {
  const { isOffline, getPendingSync } = useOfflineStorage()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    const updatePendingCount = () => {
      const pending = getPendingSync()
      setPendingCount(pending.length)
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)

    // Listen for online events to trigger sync
    const handleOnline = () => {
      if (pendingCount > 0) {
        setIsSyncing(true)
        // Simulate sync process
        setTimeout(() => {
          setIsSyncing(false)
          setLastSyncTime(new Date())
          setPendingCount(0)
        }, 2000)
      }
    }

    window.addEventListener("online", handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
    }
  }, [getPendingSync, pendingCount])

  if (isOffline && pendingCount === 0) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CloudOff className="w-3 h-3" />
        غير متصل
      </Badge>
    )
  }

  if (pendingCount > 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
            {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudOff className="w-3 h-3" />}
            {isSyncing ? "جاري المزامنة..." : `${pendingCount} في الانتظار`}
          </Badge>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (lastSyncTime) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-3 h-3" />
        متزامن
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Cloud className="w-3 h-3" />
      متصل
    </Badge>
  )
}
