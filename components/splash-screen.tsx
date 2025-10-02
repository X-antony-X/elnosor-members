'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function SplashScreen() {
  useEffect(() => {
    // Request camera permission on first app open
    const requestPermissions = async () => {
      try {
        // Request camera permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop()) // Stop immediately after permission granted
          console.log('Camera permission granted')
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            console.log('Notification permission granted')
          }
        }
      } catch (error) {
        console.log('Permission request failed:', error)
        // Show toast explaining permissions
        setTimeout(() => {
          toast('البرنامج يحتاج إذن الكاميرا والإشعارات لرفع الصور وإرسال التنبيهات', {
            duration: 5000,
            icon: 'ℹ️',
          })
        }, 2000)
      }
    }

    // Delay permission request to ensure user interaction
    const timer = setTimeout(requestPermissions, 1000)

    return () => clearTimeout(timer)
  }, [])

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
