'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-sm">
      <style jsx>{`
        .logo-animation {
          animation: eagleMove 3s ease-in-out infinite;
        }

        @keyframes eagleMove {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotateX(0deg);
          }
          25% {
            transform: translate(10px, -10px) scale(1.1) rotateX(5deg);
          }
          50% {
            transform: translate(-10px, 10px) scale(0.9) rotateX(-5deg);
          }
          75% {
            transform: translate(5px, 5px) scale(1.05) rotateX(3deg);
          }
        }
      `}</style>
      <div className="logo-animation">
        <Image
          src="/images/eagle.png"
          alt="شباب النسور"
          width={300}
          height={70}
          className="w-72 h-auto drop-shadow-2xl filter brightness-110 contrast-110"
          priority
        />
      </div>
    </div>
  )
}
