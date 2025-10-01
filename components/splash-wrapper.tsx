'use client'

import { useState, useEffect } from 'react'
import SplashScreen from './splash-screen'

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2800) // 2 seconds

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen />}
      {children}
    </>
  )
}
