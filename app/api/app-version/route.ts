import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const version = {
      version: process.env.npm_package_version || "1.0.0",
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching app version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}
