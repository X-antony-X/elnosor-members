import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templatesQuery = await adminDb.collection("notificationTemplates").orderBy("createdAt", "desc").get()

    const templates = templatesQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json({ error: "Failed to get templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, title, message, category, targetAudience, variables } = await request.json()

    if (!name || !title || !message) {
      return NextResponse.json({ error: "Name, title and message are required" }, { status: 400 })
    }

    const templateRef = adminDb.collection("notificationTemplates").doc()
    const templateData = {
      name,
      title,
      message,
      category: category || "custom",
      targetAudience: targetAudience || "all",
      variables: variables || [],
      createdBy: user.uid,
      createdAt: new Date(),
      isActive: true,
    }

    await templateRef.set(templateData)

    return NextResponse.json({
      success: true,
      templateId: templateRef.id,
      template: { id: templateRef.id, ...templateData },
    })
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
