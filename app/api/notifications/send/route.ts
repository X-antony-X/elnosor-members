import { NextRequest, NextResponse } from 'next/server'
import webpush, { PushSubscription } from 'web-push'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, getApps } from 'firebase-admin/app'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  })
}

const db = getFirestore()

webpush.setVapidDetails(
  "mailto:petereshak11@gmail.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { title, message, targetAudience, targetIds } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    // OneSignal API call
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        included_segments: targetAudience === 'all' ? ['All'] : undefined,
        include_external_user_ids: targetAudience === 'individuals' && targetIds ? targetIds : undefined,
        // For groups, need to handle differently
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    const result = await response.json()

    // Send web-push notifications
    try {
      const usersSnapshot = await db.collection('users').get()
      const sendPromises: Promise<any>[] = []
      usersSnapshot.forEach((userDoc) => {
        const subRef = userDoc.ref.collection('pushSubscription').doc('subscription')
        sendPromises.push(
          subRef.get().then((subDoc) => {
            if (!subDoc.exists) return
            const subscription = subDoc.data() as PushSubscription
            if (!subscription) return
            return webpush.sendNotification(subscription, JSON.stringify({
              title,
              body: message,
              icon: '/icons/icon-192x192.png',
              url: '/notifications'
            })).catch(async (error) => {
              console.error('Web-push error:', error)
              if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription no longer valid, delete it
                await subRef.delete()
              }
            })
          })
        )
      })
      await Promise.all(sendPromises)
    } catch (error) {
      console.error('Error sending web-push notifications:', error)
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
