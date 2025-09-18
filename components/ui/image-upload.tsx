"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, ImageIcon, Camera, Image as ImageIconLucide, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cloudinary } from "@/lib/cloudinary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface ImageUploadProps {
  onUpload: (url: string) => void
  onRemove?: () => void
  currentImage?: string
  uploadType: "member" | "post" | "notification" | "user"
  entityId: string
  maxSize?: number // in MB
  accept?: string
  className?: string
  showSourceSelector?: boolean
}

export function ImageUpload({
  onUpload,
  onRemove,
  currentImage,
  uploadType,
  entityId,
  maxSize = 5,
  accept = "image/*",
  className = "",
  showSourceSelector = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedSource, setSelectedSource] = useState<"camera" | "gallery" | "file">("gallery")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`)
      return
    }

    setUploading(true)
    try {
      let imageUrl: string

      switch (uploadType) {
        case "member":
          imageUrl = await cloudinary.uploadMemberPhoto(file, entityId)
          break
        case "post":
          imageUrl = await cloudinary.uploadPostImage(file, entityId)
          break
        case "notification":
          imageUrl = await cloudinary.uploadNotificationImage(file, entityId)
          break
        case "user":
          imageUrl = await cloudinary.uploadUserPhoto(file, entityId)
          break
        default:
          throw new Error("Invalid upload type")
      }

      onUpload(imageUrl)
    } catch (error) {
      console.error("Upload error:", error)
      alert("حدث خطأ في رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      handleFileSelect(imageFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUploadClick = () => {
    if (uploading) return

    switch (selectedSource) {
      case "camera":
        cameraInputRef.current?.click()
        break
      case "gallery":
      case "file":
      default:
        fileInputRef.current?.click()
        break
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
        title="upload"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
        title="camera"
      />

      {showSourceSelector && (
        <div className="mb-4">
          <Select value={selectedSource} onValueChange={(value: "camera" | "gallery" | "file") => setSelectedSource(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر مصدر الصورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  الكاميرا
                </div>
              </SelectItem>
              <SelectItem value="gallery">
                <div className="flex items-center gap-2">
                  <ImageIconLucide className="w-4 h-4" />
                  معرض الصور
                </div>
              </SelectItem>
              <SelectItem value="file">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  مدير الملفات
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentImage ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <Card glassy className="overflow-hidden">
              <CardContent className="p-0 relative">
                <Image
                  src={currentImage || "/placeholder.svg"}
                  alt="Uploaded image"
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                {onRemove && (
                  <Button variant="danger" size="sm" className="absolute top-2 right-2" onClick={onRemove}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card glassy
              className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => handleUploadClick()}
            >
              <CardContent className="p-8 text-center">
                {uploading ? (
                  <div className="space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">جاري رفع الصورة...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      {dragOver ? (
                        <Upload className="w-6 h-6 text-primary-600" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {dragOver ? "اترك الصورة هنا" : "اضغط لرفع صورة أو اسحبها هنا"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, GIF حتى {maxSize} ميجابايت
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
