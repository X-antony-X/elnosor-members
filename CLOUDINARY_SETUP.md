# Cloudinary Setup Guide

This project uses Cloudinary as a free alternative to Firebase Storage for image uploads and management.

## Environment Variables

Add these environment variables to your Vercel project:

\`\`\`env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
\`\`\`

## Cloudinary Account Setup

1. **Create Account**: Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)

2. **Get Cloud Name**: 
   - Go to Dashboard
   - Copy your "Cloud name" 
   - Set as `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

3. **Create Upload Preset**:
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Set preset name (e.g., "church-youth-uploads")
   - Set signing mode to "Unsigned"
   - Configure folder structure and transformations as needed
   - Set as `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Features

- **Free Tier**: 25GB storage, 25GB monthly bandwidth
- **Automatic Optimization**: Images are automatically optimized for web
- **Transformations**: Resize, crop, format conversion on-the-fly
- **CDN**: Global content delivery network
- **No Payment Required**: Unlike Firebase Storage

## Usage Examples

\`\`\`typescript
import { cloudinary } from '@/lib/cloudinary'

// Upload member photo
const photoUrl = await cloudinary.uploadMemberPhoto(file, memberId)

// Upload post image
const imageUrl = await cloudinary.uploadPostImage(file, postId)

// Get optimized image URL
const optimizedUrl = cloudinary.getOptimizedUrl(publicId, {
  width: 400,
  height: 300,
  quality: 'auto',
  format: 'webp'
})
\`\`\`

## Folder Structure

Images are organized in Cloudinary as:
- `church-youth/members/{memberId}/` - Member photos
- `church-youth/posts/{postId}/` - Post images  
- `church-youth/notifications/{notificationId}/` - Notification images
- `church-youth/users/{userId}/` - User profile photos

## Migration from Firebase Storage

1. Remove Firebase Storage configuration
2. Update image upload components to use Cloudinary
3. Update environment variables
4. Test image uploads and display
5. Optional: Migrate existing images from Firebase Storage to Cloudinary
