"use client"

import { useEffect, useRef, useState } from "react"
import { Camera } from "lucide-react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsScanning(true)

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanForQR, 500)
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error)
      let errorMessage = "لا يمكن الوصول للكاميرا. تأكد من منح الإذن للوصول للكاميرا."
      if (error.name === 'NotAllowedError') {
        errorMessage = "تم رفض إذن الوصول للكاميرا. يرجى منح الإذن من إعدادات المتصفح."
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "الكاميرا غير مدعومة على هذا الجهاز."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا."
      } else if (error.name === 'NotReadableError') {
        errorMessage = "الكاميرا مستخدمة من تطبيق آخر."
      }
      onError?.(errorMessage)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
  }

  const scanForQR = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        onScan(code.data)
        stopCamera()
      }
    } catch (error) {
      console.error("QR scanning error:", error)
    }
  }

  return (
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 bg-black rounded-lg object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-8 h-8 mx-auto mb-2 text-white" />
            <p className="text-sm text-white">وجه الكاميرا نحو كود QR</p>
          </div>
        </div>
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">جاري المسح...</div>
      )}
    </div>
  )
}
