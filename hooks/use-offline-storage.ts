"use client"

import { useState, useEffect } from "react"
import type { Member, AttendanceLog, Post } from "@/lib/types"

interface OfflineData {
  members: Member[]
  attendanceLogs: AttendanceLog[]
  posts: Post[]
  lastSync: Date
}

export const useOfflineStorage = () => {
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load offline data from localStorage
    loadOfflineData()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem("church-youth-offline-data")
      if (stored) {
        const data = JSON.parse(stored)
        // Convert date strings back to Date objects
        data.lastSync = new Date(data.lastSync)
        data.attendanceLogs = data.attendanceLogs.map((log: any) => ({
          ...log,
          checkInTimestamp: new Date(log.checkInTimestamp),
          checkOutTimestamp: log.checkOutTimestamp ? new Date(log.checkOutTimestamp) : undefined,
        }))
        data.posts = data.posts.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          comments: post.comments.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
          })),
        }))
        data.members = data.members.map((member: any) => ({
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        }))
        setOfflineData(data)
      }
    } catch (error) {
      console.error("Error loading offline data:", error)
    }
  }

  const saveOfflineData = (data: Partial<OfflineData>) => {
    try {
      const currentData = offlineData || {
        members: [],
        attendanceLogs: [],
        posts: [],
        lastSync: new Date(),
      }

      const updatedData = {
        ...currentData,
        ...data,
        lastSync: new Date(),
      }

      localStorage.setItem("church-youth-offline-data", JSON.stringify(updatedData))
      setOfflineData(updatedData)
    } catch (error) {
      console.error("Error saving offline data:", error)
    }
  }

  const addOfflineAttendance = (attendanceLog: AttendanceLog) => {
    if (!offlineData) return

    const updatedLogs = [...offlineData.attendanceLogs, attendanceLog]
    saveOfflineData({ attendanceLogs: updatedLogs })

    // Store for background sync
    const pendingSync = JSON.parse(localStorage.getItem("pending-attendance-sync") || "[]")
    pendingSync.push(attendanceLog)
    localStorage.setItem("pending-attendance-sync", JSON.stringify(pendingSync))

    // Register background sync if available
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if ("sync" in registration) {
          // @ts-ignore
          return registration.sync.register("attendance-sync")
        }
      })
    }
  }

  const getPendingSync = () => {
    try {
      return JSON.parse(localStorage.getItem("pending-attendance-sync") || "[]")
    } catch {
      return []
    }
  }

  const clearPendingSync = () => {
    localStorage.removeItem("pending-attendance-sync")
  }

  const getOfflineMembers = () => offlineData?.members || []
  const getOfflineAttendance = () => offlineData?.attendanceLogs || []
  const getOfflinePosts = () => offlineData?.posts || []

  return {
    isOffline,
    offlineData,
    saveOfflineData,
    addOfflineAttendance,
    getPendingSync,
    clearPendingSync,
    getOfflineMembers,
    getOfflineAttendance,
    getOfflinePosts,
  }
}
