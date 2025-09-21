# Cloudinary Setup Guide - Complete Solution

## 🚨 Problem Solved

Your "Failed to upload image" error is caused by missing Cloudinary configuration. This guide provides a complete solution.

## 📋 Quick Fix

### Option 1: Use the Setup Script (Recommended)

```bash
# Run the interactive setup script
node setup-cloudinary.js
```

This will:

- ✅ Guide you through the setup process
- ✅ Create `.env.local` with your credentials
- ✅ Provide clear next steps

### Option 2: Manual Setup

1. **Create Cloudinary Account** (free):

   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account

2. **Get Your Cloud Name**:

   - Go to Dashboard
   - Copy your "Cloud name" (e.g., `my-church-app`)

3. **Create Upload Preset**:

   - Go to Settings → Upload
   - Click "Add upload preset"
   - Name: `church-youth-uploads`
   - Signing mode: "Unsigned"
   - Save

4. **Create `.env.local`**:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=church-youth-uploads
   ```

## 🔧 Environment Variables

Your `.env.local` should contain:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name

# Server-side (for admin operations)
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🧪 Testing the Setup

1. **Restart your development server**:

   ```bash
   npm run dev
   ```

2. **Test image upload**:

   - Go to any page with image upload (members, posts, etc.)
   - Try uploading an image
   - Check browser console for success/error messages

3. **Check configuration**:
   - Open browser console
   - Look for "✅ Cloudinary configured successfully" message

## 📁 Files Created/Modified

- ✅ `.env.example` - Template for environment variables
- ✅ `app/api/upload/route.ts` - New upload API endpoint
- ✅ `lib/cloudinary.ts` - Enhanced with better error handling
- ✅ `setup-cloudinary.js` - Interactive setup script

## 🔍 Troubleshooting

### "Cloudinary not configured properly"

- Check if `.env.local` exists and has correct values
- Verify environment variables are loaded (restart dev server)
- Check browser console for specific missing variables

### "Upload failed"

- Verify your Cloudinary account is active
- Check upload preset settings in Cloudinary dashboard
- Ensure preset is set to "Unsigned" mode

### "Invalid file type"

- Only images are allowed (JPEG, PNG, WebP, GIF)
- Maximum file size: 5MB

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Free Cloudinary Account](https://cloudinary.com/users/register/free)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)

## 🎯 What's Fixed

1. **Missing Upload API** - Created `/api/upload` endpoint
2. **Poor Error Messages** - Enhanced error handling with specific details
3. **Configuration Issues** - Better validation and setup guidance
4. **Missing Environment Variables** - Clear instructions and templates

## 🚀 Next Steps

1. Run the setup script: `node setup-cloudinary.js`
2. Follow the prompts to enter your Cloudinary credentials
3. Restart your development server
4. Test image upload functionality

Your image upload should now work perfectly! 🎉
