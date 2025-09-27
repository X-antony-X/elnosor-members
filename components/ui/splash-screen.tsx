import { useEffect, useState } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete()
    }, 3000) 

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Eagle flying animation */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src="/images/eagle.png"
          alt="Eagle"
          className="absolute w-16 h-16 animate-fly-around"
          style={{
            animation: "flyAround 4s linear infinite",
          }}
        />
      </div>

      {/* Optional loading text */}
      <div className="absolute bottom-10 text-white text-lg font-arabic">
        جاري التحميل...
      </div>

      <style jsx>{`
        @keyframes flyAround {
          0% {
            transform: translate(0, 100vh) rotate(0deg);
          }
          25% {
            transform: translate(100vw, 50vh) rotate(90deg);
          }
          50% {
            transform: translate(50vw, 0) rotate(180deg);
          }
          75% {
            transform: translate(0, 50vh) rotate(270deg);
          }
          100% {
            transform: translate(0, 100vh) rotate(360deg);
          }
        }
        .animate-fly-around {
          animation: flyAround 4s linear infinite;
        }
      `}</style>
    </div>
  )
}
