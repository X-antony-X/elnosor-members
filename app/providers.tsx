"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserRole } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SplashScreen } from "@/components/ui/splash-screen"

export interface AuthContextType {
  user: User | null
  role: "admin" | "member" | null
  token: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  loading: true,
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

  useEffect(() => {
    // Set hydrated flag after component mounts to prevent hydration mismatch
    setIsHydrated(true)

    // Register service worker for web-push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
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
    <AuthContext.Provider value={{ user, role, token, loading }}>
      <ThemeProvider>
        {children}
        {showSplash && (
          <SplashScreen
            duration={3000}
            onComplete={() => {
              setShowSplash(false)
              hasShownSplash.current = true
            }}
          />
        )}
      </ThemeProvider>
    </AuthContext.Provider>
  )
}
