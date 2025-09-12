import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { adminDb } from "@/lib/firebase-admin"
import { ExcelService } from "@/lib/excel-utils"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload an Excel file." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    const { members, errors } = await ExcelService.importMembers(file)

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
          importedCount: 0,
        },
        { status: 400 },
      )
    }

    // Save members to Firestore
    const batch = adminDb.batch()
    const importedMembers = []

    for (const memberData of members) {
      const memberRef = adminDb.collection("members").doc()
      const memberWithId = {
        ...memberData,
        id: memberRef.id,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      batch.set(memberRef, memberWithId)
      importedMembers.push(memberWithId)
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      importedCount: members.length,
      members: importedMembers,
    })
  } catch (error) {
    console.error("Import members error:", error)
    return NextResponse.json(
      {
        error: "Failed to import members",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
