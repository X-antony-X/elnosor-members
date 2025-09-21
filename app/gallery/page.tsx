"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/app/providers_old"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAttendance } from "@/hooks/use-firestore"
import type { Meeting } from "@/lib/types"

const sampleImages = [
  "/images/1.jpg",
  "/images/2.jpg",
  "/images/3.jpg",
  "/images/4.jpg",
  "/images/5.jpeg",
]

export default function GalleryPage() {
  const { role, user } = useAuth()
  const router = useRouter()
  const { meetings, loading } = useAttendance()
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    // Collect all photos from meetings
    const meetingPhotos: string[] = []
    meetings.forEach((meeting: Meeting) => {
      if (meeting.photos && meeting.photos.length > 0) {
        meetingPhotos.push(...meeting.photos)
      }
    })

    // If no meeting photos, use sample images
    if (meetingPhotos.length === 0) {
      setImages(sampleImages)
    } else {
      setImages(meetingPhotos)
    }
  }, [meetings])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">معرض صور الاجتماعات</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((src, index) => (
          <motion.div
            key={index}
            className="overflow-hidden rounded-lg shadow-lg cursor-pointer"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <img src={src} alt={`Meeting photo ${index + 1}`} className="w-full h-48 object-cover" />
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button onClick={() => router.push("/dashboard")}>العودة إلى لوحة التحكم</Button>
      </div>
    </div>
  )
}
