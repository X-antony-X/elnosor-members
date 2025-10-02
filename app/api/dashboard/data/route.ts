import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function calculateRealAnalytics(uid: string, role: "admin" | "member") {
  try {
    // Get all members
    const membersSnapshot = await adminDb.collection("members").get();
    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
    }));

    // Get all attendance logs
    const attendanceSnapshot = await adminDb
      .collection("attendance_logs")
      .get();
    const attendanceLogs = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      checkInTimestamp:
        doc.data().checkInTimestamp?.toDate?.() ||
        new Date(doc.data().checkInTimestamp),
    }));

    // Get all meetings
    const meetingsSnapshot = await adminDb.collection("meetings").get();
    const meetings = meetingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Get all posts
    const postsSnapshot = await adminDb.collection("posts").get();
    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      likes: doc.data().likes || [],
      comments: doc.data().comments || [],
    }));

    // Calculate total members
    const totalMembers = members.length;

    // Calculate attendance rate
    const totalPossibleAttendance = members.length * meetings.length;
    const actualAttendance = attendanceLogs.length;
    const attendanceRate =
      totalPossibleAttendance > 0
        ? Math.round((actualAttendance / totalPossibleAttendance) * 100)
        : 0;

    // Calculate active members (members with attendance in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = attendanceLogs.filter(
      (log) => log.checkInTimestamp >= thirtyDaysAgo
    );
    const activeMemberIds = new Set(
      recentLogs.map((log) => (log as any).memberId)
    );
    const activeMembers = activeMemberIds.size;

    // Calculate engagement rate
    const totalEngagement = posts.reduce(
      (sum, post) =>
        sum + (post.likes?.length || 0) + (post.comments?.length || 0),
      0
    );
    const engagementRate =
      posts.length > 0 && members.length > 0
        ? Math.round((totalEngagement / (posts.length * members.length)) * 100)
        : 0;

    // For member-specific data
    let memberAttendanceCount = 0;
    let memberAttendanceRate = 0;

    if (role === "member") {
      const memberLogs = attendanceLogs.filter(
        (log) => (log as any).memberId === uid
      );
      memberAttendanceCount = memberLogs.length;
      const memberPossibleAttendance = meetings.length;
      memberAttendanceRate =
        memberPossibleAttendance > 0
          ? Math.round((memberAttendanceCount / memberPossibleAttendance) * 100)
          : 0;
    }

    return {
      totalMembers,
      attendanceRate,
      activeMembers,
      engagementRate,
      memberAttendanceCount,
      memberAttendanceRate,
    };
  } catch (error) {
    console.error("Error calculating analytics:", error);
    // Return default values on error
    return {
      totalMembers: 0,
      attendanceRate: 0,
      activeMembers: 0,
      engagementRate: 0,
      memberAttendanceCount: 0,
      memberAttendanceRate: 0,
    };
  }
}

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

    // Calculate real analytics from database
    const analytics = await calculateRealAnalytics(uid, role);

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
                change: "+0%", // Could calculate real change if needed
                changeType: "neutral" as const,
              },
              {
                title: "معدل الحضور",
                value: `${analytics.attendanceRate}%`,
                icon: "Calendar",
                change: "+0%",
                changeType: "neutral" as const,
              },
              {
                title: "المخدومين النشطون",
                value: analytics.activeMembers,
                icon: "Activity",
                change: "+0%",
                changeType: "neutral" as const,
              },
              {
                title: "معدل التفاعل",
                value: `${analytics.engagementRate}%`,
                icon: "Target",
                change: "+0%",
                changeType: "neutral" as const,
              },
            ]
          : [
              {
                title: "معدل حضوري",
                value: `${analytics.memberAttendanceRate}%`,
                icon: "Calendar",
                change: "+0%",
                changeType: "neutral" as const,
              },
              {
                title: "مشاركاتي",
                value: analytics.memberAttendanceCount,
                icon: "Activity",
                change: "نشط",
                changeType: "positive" as const,
              },
              {
                title: "معدل التفاعل",
                value: `${analytics.engagementRate}%`,
                icon: "Target",
                change: "+0%",
                changeType: "neutral" as const,
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
