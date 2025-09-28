import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
