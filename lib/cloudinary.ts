// Cloudinary configuration and upload utilities
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

interface UploadOptions {
  folder?: string;
  transformation?: string;
  quality?: string | number;
  format?: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

    if (!this.cloudName || !this.uploadPreset) {
      console.warn(
        "Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
      );
    }
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error("Cloudinary not configured properly");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.transformation) {
      formData.append("transformation", options.transformation);
    }

    if (options.quality) {
      formData.append("quality", options.quality.toString());
    }

    if (options.format) {
      formData.append("format", options.format);
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: CloudinaryUploadResult = await response.json();
      return result;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  /**
   * Upload member photo
   */
  async uploadMemberPhoto(file: File, memberId: string): Promise<string> {
    const result = await this.uploadFile(file, {
      folder: `church-youth/members/${memberId}`,
      transformation: "c_fill,w_400,h_400,q_auto,f_auto",
      quality: "auto",
    });
    return result.secure_url;
  }

  /**
   * Upload post image
   */
  async uploadPostImage(file: File, postId: string): Promise<string> {
    const result = await this.uploadFile(file, {
      folder: `church-youth/posts/${postId}`,
      transformation: "c_limit,w_800,h_600,q_auto,f_auto",
      quality: "auto",
    });
    return result.secure_url;
  }

  /**
   * Upload notification image
   */
  async uploadNotificationImage(
    file: File,
    notificationId: string
  ): Promise<string> {
    const result = await this.uploadFile(file, {
      folder: `church-youth/notifications/${notificationId}`,
      transformation: "c_limit,w_600,h_400,q_auto,f_auto",
      quality: "auto",
    });
    return result.secure_url;
  }

  /**
   * Upload user profile photo
   */
  async uploadUserPhoto(file: File, userId: string): Promise<string> {
    const result = await this.uploadFile(file, {
      folder: `church-youth/users/${userId}`,
      transformation: "c_fill,w_200,h_200,q_auto,f_auto",
      quality: "auto",
    });
    return result.secure_url;
  }

  /**
   * Upload meeting photo
   */
  async uploadMeetingPhoto(file: File, meetingId: string): Promise<string> {
    const result = await this.uploadFile(file, {
      folder: `church-youth/meetings/${meetingId}`,
      transformation: "c_limit,w_800,h_600,q_auto,f_auto",
      quality: "auto",
    });
    return result.secure_url;
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    // Note: Deleting images requires server-side implementation with API secret
    // This would typically be done via a Vercel serverless function
    console.warn("Image deletion requires server-side implementation");
    return false;
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    if (!this.cloudName) return "";

    const transformations = [];

    if (options.width || options.height) {
      const w = options.width ? `w_${options.width}` : "";
      const h = options.height ? `h_${options.height}` : "";
      const c = options.crop ? `c_${options.crop}` : "c_limit";
      transformations.push([w, h, c].filter(Boolean).join(","));
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString =
      transformations.length > 0 ? `/${transformations.join("/")}` : "";

    return `https://res.cloudinary.com/${this.cloudName}/image/upload${transformationString}/${publicId}`;
  }
}

// Export singleton instance
export const cloudinary = new CloudinaryService();

// Export types
export type { CloudinaryUploadResult, UploadOptions };
