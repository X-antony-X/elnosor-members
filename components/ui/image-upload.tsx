"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, ImageIcon, Camera, Image as ImageIconLucide, Folder, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cloudinary } from "@/lib/cloudinary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import toast from "react-hot-toast"

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
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<CropType>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`)
      return
    }
    setSelectedFile(file)
    setCropModalOpen(true)
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
      if (file.size > maxSize * 1024 * 1024) {
        alert(`حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`)
        return
      }
      setSelectedFile(file)
      setCropModalOpen(true)
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately
      return true
    } catch (error) {
      console.error("Camera permission denied:", error)
      alert("يجب السماح بالوصول إلى الكاميرا")
      return false
    }
  }

  const handleUploadClick = async () => {
    if (uploading) return

    switch (selectedSource) {
      case "camera":
        const hasPermission = await requestCameraPermission()
        if (hasPermission) {
          cameraInputRef.current?.click()
        }
        break
      case "gallery":
      case "file":
      default:
        fileInputRef.current?.click()
        break
    }
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    // Allow free cropping, not forced to center
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
      },
      1, // aspect ratio 1:1 for square
      width,
      height
    )
    setCrop(crop)
    setCompletedCrop(crop)
  }

  const handleCropComplete = (crop: CropType) => {
    setCompletedCrop(crop)
  }

  const handleSkipCrop = async () => {
    if (!selectedFile) return

    setCropModalOpen(false)
    setUploading(true)

    try {
      console.log("Starting upload for type:", uploadType, "entityId:", entityId)
      let imageUrl: string

      switch (uploadType) {
        case "member":
          imageUrl = await cloudinary.uploadMemberPhoto(selectedFile, entityId)
          break
        case "post":
          imageUrl = await cloudinary.uploadPostImage(selectedFile, entityId)
          break
        case "notification":
          imageUrl = await cloudinary.uploadNotificationImage(selectedFile, entityId)
          break
        case "user":
          imageUrl = await cloudinary.uploadUserPhoto(selectedFile, entityId)
          break
        default:
          throw new Error("Invalid upload type")
      }

      console.log("Upload successful, URL:", imageUrl)
      onUpload(imageUrl)
      setSelectedFile(null)
      setCompletedCrop(undefined)
      toast.success("تم رفع الصورة بنجاح")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("حدث خطأ في رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  const handleCropConfirm = async () => {
    if (!selectedFile || !completedCrop || !imgRef.current) return

    setCropModalOpen(false)
    setUploading(true)

    try {
      console.log("Starting cropped upload for type:", uploadType, "entityId:", entityId)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      const image = imgRef.current
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = completedCrop.width * scaleX
      canvas.height = completedCrop.height * scaleY

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to create blob')

        const croppedFile = new File([blob], selectedFile.name, { type: selectedFile.type })

        let imageUrl: string

        switch (uploadType) {
          case "member":
            imageUrl = await cloudinary.uploadMemberPhoto(croppedFile, entityId)
            break
          case "post":
            imageUrl = await cloudinary.uploadPostImage(croppedFile, entityId)
            break
          case "notification":
            imageUrl = await cloudinary.uploadNotificationImage(croppedFile, entityId)
            break
          case "user":
            imageUrl = await cloudinary.uploadUserPhoto(croppedFile, entityId)
            break
          default:
            throw new Error("Invalid upload type")
        }

        console.log("Cropped upload successful, URL:", imageUrl)
        onUpload(imageUrl)
        setSelectedFile(null)
        setCompletedCrop(undefined)
        toast.success("تم رفع الصورة المقصوصة بنجاح")
      }, selectedFile.type)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("حدث خطأ في رفع الصورة")
    } finally {
      setUploading(false)
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
        // capture="environment"
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
        title="camera"
      />

      {showSourceSelector && (
        <div className="mb-4">
          <Select value={selectedSource} onValueChange={async (value: "camera" | "gallery" | "file") => {
            setSelectedSource(value)
            // Trigger the file picker immediately
            switch (value) {
              case "camera":
                const hasPermission = await requestCameraPermission()
                if (hasPermission) {
                  cameraInputRef.current?.click()
                }
                break
              case "gallery":
              case "file":
              default:
                fileInputRef.current?.click()
                break
            }
          }}>
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

      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedFile && (
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={handleCropComplete}
                aspect={1}
              >
                <img
                  ref={imgRef}
                  src={URL.createObjectURL(selectedFile)}
                  onLoad={onImageLoad}
                  alt="Crop preview"
                  className="max-w-full max-h-64"
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setCropModalOpen(false)} variant="outline">إلغاء</Button>
            <Button onClick={handleSkipCrop} variant="outline">تخطي القص</Button>
            <Button onClick={handleCropConfirm} disabled={!completedCrop}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
