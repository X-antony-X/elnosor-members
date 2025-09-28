"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { createWorker } from "tesseract.js"
import { Camera, X, Loader2 } from "lucide-react"
import { PSM } from "tesseract.js"

interface NumberScannerProps {
  onScan: (code: string) => void
  onError: (error: string) => void
  start: boolean
}

export function NumberScanner({ onScan, onError, start }: NumberScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workerRef = useRef<Tesseract.Worker | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const initializeWorker = useCallback(async () => {
    try {
      workerRef.current = await createWorker('ara+eng', 1, {
        logger: m => console.log(m)
      })
      await workerRef.current.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Uniform block of text
      })
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error)
      onError('فشل في تهيئة ماسح الأرقام')
    }
  }, [onError])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      onError('لا يمكن الوصول للكاميرا')
    }
  }, [onError])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) return

      // Set canvas size to video size
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to grayscale for better OCR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        data[i] = gray     // red
        data[i + 1] = gray // green
        data[i + 2] = gray // blue
      }

      context.putImageData(imageData, 0, 0)

      // Perform OCR
      const { data: { text } } = await workerRef.current.recognize(canvas)

      // Extract 4-digit numbers
      const matches = text.match(/\b\d{4}\b/g)

      if (matches && matches.length > 0) {
        // Take the first 4-digit number found
        const detectedCode = matches[0]

        // Validate range (1000-9999)
        const codeNum = parseInt(detectedCode, 10)
        if (codeNum >= 1000 && codeNum <= 9999) {
          onScan(detectedCode)
          setIsScanning(false)
          return
        }
      }
    } catch (error) {
      console.error('OCR processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [onScan, isProcessing])

  useEffect(() => {
    if (start && !isScanning) {
      setIsScanning(true)
      initializeWorker().then(() => {
        startCamera()
      })
    } else if (!start && isScanning) {
      setIsScanning(false)
      stopCamera()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      stopCamera()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [start, isScanning, initializeWorker, startCamera, stopCamera])

  useEffect(() => {
    if (isScanning && !intervalRef.current) {
      // Scan every 2 seconds
      intervalRef.current = setInterval(captureAndProcess, 2000)
    } else if (!isScanning && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isScanning, captureAndProcess])

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">جاري البحث عن الأرقام...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          وجه الكاميرا نحو الكود المكون من 4 أرقام
        </p>
        <p className="text-xs text-gray-500">
          سيتم الكشف التلقائي عند العثور على كود صالح
        </p>
      </div>
    </div>
  )
}
