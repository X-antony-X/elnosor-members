"use client"

import { useState, useEffect } from "react"
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Member, Post, AttendanceLog, Meeting } from "@/lib/types"

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "members"),
      (snapshot) => {
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Member[]

        setMembers(membersData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("Error fetching members:", error)
        setError("خطأ في تحميل بيانات الأعضاء")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { members, loading, error }
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          comments:
            doc.data().comments?.map((comment: any) => ({
              ...comment,
              createdAt: comment.createdAt?.toDate() || new Date(),
            })) || [],
        })) as Post[]

        setPosts(postsData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("Error fetching posts:", error)
        setError("خطأ في تحميل المنشورات")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { posts, loading, error }
}

export const useAttendance = (meetingId?: string) => {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to meetings
    const unsubscribeMeetings = onSnapshot(
      query(collection(db, "meetings"), orderBy("date", "desc")),
      (snapshot) => {
        const meetingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Meeting[]

        setMeetings(meetingsData)
      },
      (error) => {
        console.error("Error fetching meetings:", error)
        setError("خطأ في تحميل بيانات الاجتماعات")
      },
    )

    // Subscribe to attendance logs
    const attendanceQuery = meetingId
      ? query(collection(db, "attendance"), where("meetingId", "==", meetingId))
      : collection(db, "attendance")

    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const attendanceData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          checkInTimestamp: doc.data().checkInTimestamp?.toDate() || new Date(),
          checkOutTimestamp: doc.data().checkOutTimestamp?.toDate(),
        })) as AttendanceLog[]

        setAttendanceLogs(attendanceData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("Error fetching attendance:", error)
        setError("خطأ في تحميل بيانات الحضور")
        setLoading(false)
      },
    )

    return () => {
      unsubscribeMeetings()
      unsubscribeAttendance()
    }
  }, [meetingId])

  return { attendanceLogs, meetings, loading, error }
}

export const firestoreHelpers = {
  // Add new member
  addMember: async (memberData: Omit<Member, "id" | "createdAt" | "updatedAt">) => {
    const now = Timestamp.now()
    const data = {
      ...memberData,
      createdAt: now,
      updatedAt: now,
    }
    return await setDoc(doc(db, "members", memberData.uid!), data)
  },

  // Update member
  updateMember: async (memberId: string, updates: Partial<Member>) => {
    const memberRef = doc(db, "members", memberId)
    return await updateDoc(memberRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  // Delete member
  deleteMember: async (memberId: string) => {
    const memberRef = doc(db, "members", memberId)
    return await deleteDoc(memberRef)
  },

  // Add new post
  addPost: async (postData: Omit<Post, "id" | "createdAt">) => {
    return await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: Timestamp.now(),
    })
  },

  // Update post
  updatePost: async (postId: string, updates: Partial<Post>) => {
    const postRef = doc(db, "posts", postId)
    return await updateDoc(postRef, updates)
  },

  // Delete post
  deletePost: async (postId: string) => {
    const postRef = doc(db, "posts", postId)
    return await deleteDoc(postRef)
  },

  // Add attendance log
  addAttendanceLog: async (logData: Omit<AttendanceLog, "id">) => {
    return await addDoc(collection(db, "attendance"), {
      ...logData,
      checkInTimestamp: Timestamp.fromDate(logData.checkInTimestamp),
      checkOutTimestamp: logData.checkOutTimestamp ? Timestamp.fromDate(logData.checkOutTimestamp) : null,
    })
  },

  // Update attendance log
  updateAttendanceLog: async (logId: string, updates: Partial<AttendanceLog>) => {
    const logRef = doc(db, "attendance", logId)
    const updateData: any = { ...updates }

    if (updates.checkInTimestamp) {
      updateData.checkInTimestamp = Timestamp.fromDate(updates.checkInTimestamp)
    }
    if (updates.checkOutTimestamp) {
      updateData.checkOutTimestamp = Timestamp.fromDate(updates.checkOutTimestamp)
    }

    return await updateDoc(logRef, updateData)
  },

  // Add new meeting
  addMeeting: async (meetingData: Omit<Meeting, "id" | "createdAt">) => {
    return await addDoc(collection(db, "meetings"), {
      ...meetingData,
      date: Timestamp.fromDate(meetingData.date),
      startTime: Timestamp.fromDate(meetingData.startTime),
      endTime: Timestamp.fromDate(meetingData.endTime),
      createdAt: Timestamp.now(),
    })
  },
}

export const useFirestoreHelpers = () => firestoreHelpers
