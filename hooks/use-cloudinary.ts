"use client"

import { useState } from "react"
import { cloudinary } from "@/lib/cloudinary"

interface UseCloudinaryOptions {
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export function useCloudinary(options: UseCloudinaryOptions = {}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploadMemberPhoto = async (file: File, memberId: string) => {
    setUploading(true)
    setError(null)

    try {
      const url = await cloudinary.uploadMemberPhoto(file, memberId)
      options.onSuccess?.(url)
      return url
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const uploadPostImage = async (file: File, postId: string) => {
    setUploading(true)
    setError(null)

    try {
      const url = await cloudinary.uploadPostImage(file, postId)
      options.onSuccess?.(url)
      return url
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const uploadNotificationImage = async (file: File, notificationId: string) => {
    setUploading(true)
    setError(null)

    try {
      const url = await cloudinary.uploadNotificationImage(file, notificationId)
      options.onSuccess?.(url)
      return url
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const uploadUserPhoto = async (file: File, userId: string) => {
    setUploading(true)
    setError(null)

    try {
      const url = await cloudinary.uploadUserPhoto(file, userId)
      options.onSuccess?.(url)
      return url
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (publicId: string) => {
    setUploading(true)
    setError(null)

    try {
      const response = await fetch("/api/cloudinary-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete image")
      }

      const result = await response.json()
      return result.success
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  return {
    uploading,
    error,
    uploadMemberPhoto,
    uploadPostImage,
    uploadNotificationImage,
    uploadUserPhoto,
    deleteImage,
  }
}
