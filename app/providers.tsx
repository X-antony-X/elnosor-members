"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserRole } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import SplashScreen from "@/components/splash-screen"

export interface AuthContextType {
  user: User | null
  role: "admin" | "member" | null
  token: string | null
  loading: boolean
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  loading: true,
  refreshRole: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<"admin" | "member" | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const hasShownSplash = useRef(false)

  const refreshRole = async () => {
    if (user) {
      try {
        const userRole = await getUserRole(user)
        setRole(userRole)
      } catch (error) {
        console.error("Error refreshing user role:", error)
        setRole("member") // Default fallback
      }
    }
  }

  useEffect(() => {
    // Set hydrated flag after component mounts to prevent hydration mismatch
    setIsHydrated(true)

    // Register service worker for FCM notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('FCM Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('FCM Service Worker registration failed:', error);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          const userRole = await getUserRole(user)
          setRole(userRole)
          const idToken = await user.getIdToken()
          setToken(idToken)

          // Request permissions after user is authenticated (non-blocking)
          setTimeout(() => {
            requestOptionalPermissions()
          }, 2000)
        } catch (error) {
          console.error("Error getting user role:", error)
          setRole("member") // Default fallback
          setToken(null)
        }
      } else {
        setRole(null)
        setToken(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Request optional permissions (camera and notifications) - non-blocking
  const requestOptionalPermissions = async () => {
    try {
      // Request camera permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop()) // Stop immediately after permission granted
        console.log('Camera permission granted')
      }
    } catch (error) {
      console.log('Camera permission not granted - app will work without camera features')
    }

    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      }
    } catch (error) {
      console.log('Notification permission not granted - app will work without notifications')
    }
  }

  useEffect(() => {
    if (isHydrated && !loading && !hasShownSplash.current && !showSplash) {
      setShowSplash(true)
    }
  }, [isHydrated, loading, showSplash])

  // Prevent hydration mismatch by not rendering until after client-side hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, role, token, loading, refreshRole }}>
      <ThemeProvider>
        {children}
        {showSplash && (<SplashScreen />)}
      </ThemeProvider>
    </AuthContext.Provider>
  )
}
