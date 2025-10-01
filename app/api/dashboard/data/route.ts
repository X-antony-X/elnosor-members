import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const role = userData?.role === "admin" ? "admin" : "member";

    // Get analytics data (simplified - in real app, calculate from database)
    const analytics = {
      totalMembers: 150,
      attendanceRate: 85,
      activeMembers: 120,
      engagementRate: 78,
      // Add more analytics data as needed
    };

    // Define dashboard data based on role
    const dashboardData = {
      role,
      stats:
        role === "admin"
          ? [
              {
                title: "إجمالي المخدومين",
                value: analytics.totalMembers,
                icon: "Users",
                change: "+5%",
                changeType: "positive" as const,
              },
              {
                title: "معدل الحضور",
                value: `${analytics.attendanceRate}%`,
                icon: "Calendar",
                change: "+2%",
                changeType: "positive" as const,
              },
              {
                title: "المخدومين النشطون",
                value: analytics.activeMembers,
                icon: "Activity",
                change: "+8%",
                changeType: "positive" as const,
              },
              {
                title: "معدل التفاعل",
                value: `${analytics.engagementRate}%`,
                icon: "Target",
                change: "+3%",
                changeType: "positive" as const,
              },
            ]
          : [
              {
                title: "معدل حضوري",
                value: `${analytics.attendanceRate}%`,
                icon: "Calendar",
                change: "+1%",
                changeType: "positive" as const,
              },
              {
                title: "مشاركاتي",
                value: 25,
                icon: "Activity",
                change: "نشط",
                changeType: "positive" as const,
              },
              {
                title: "معدل التفاعل",
                value: `${analytics.engagementRate}%`,
                icon: "Target",
                change: "+2%",
                changeType: "positive" as const,
              },
            ],
      showAdminActions: role === "admin",
      showMemberActions: role === "member",
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
