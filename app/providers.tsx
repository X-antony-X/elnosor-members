"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserRole } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthContextType {
  user: User | null
  role: "admin" | "member" | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<"admin" | "member" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        const userRole = await getUserRole(user)
        setRole(userRole)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthContext.Provider>
  )
}
