import { type NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "member", "post", "notification", "user", "meeting"
    const id = formData.get("id") as string; // ID of the entity

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    let uploadResult;

    try {
      // Upload based on type
      switch (type) {
        case "member":
          uploadResult = await cloudinary.uploadMemberPhoto(file, id);
          break;
        case "post":
          uploadResult = await cloudinary.uploadPostImage(file, id);
          break;
        case "notification":
          uploadResult = await cloudinary.uploadNotificationImage(file, id);
          break;
        case "user":
          uploadResult = await cloudinary.uploadUserPhoto(file, id);
          break;
        case "meeting":
          uploadResult = await cloudinary.uploadMeetingPhoto(file, id);
          break;
        default:
          return NextResponse.json(
            { error: "Invalid upload type" },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        url: uploadResult,
        message: "Image uploaded successfully",
      });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);

      // Provide more specific error messages
      if (uploadError instanceof Error) {
        if (uploadError.message.includes("not configured")) {
          return NextResponse.json(
            {
              error:
                "Cloudinary not configured. Please set up environment variables.",
              details:
                "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
            },
            { status: 500 }
          );
        }

        if (uploadError.message.includes("Upload failed")) {
          return NextResponse.json(
            {
              error:
                "Upload failed. Please check your Cloudinary configuration.",
              details: uploadError.message,
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          error: "Failed to upload image",
          details:
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Upload API is working",
    supportedTypes: ["member", "post", "notification", "user", "meeting"],
    maxFileSize: "5MB",
    allowedTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
  });
}
