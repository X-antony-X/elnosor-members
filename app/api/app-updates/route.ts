import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would check for updates from a database or external service
    // For now, return basic update info
    const updates = {
      version: process.env.npm_package_version || "1.0.0",
      lastUpdated: new Date().toISOString(),
      hasUpdates: false, // Set to true when there are updates
      updateUrl: "/update", // URL to redirect for updates
    };

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching app updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}
