# Church Youth Attendance & Engagement PWA

A comprehensive Progressive Web Application for managing church youth attendance and engagement, built with Next.js, TypeScript, and Firebase.

## Features

- **Authentication**: Google and Facebook sign-in with role-based access
- **Member Management**: CRUD operations for youth members with detailed profiles
- **Attendance Tracking**: QR code scanning and manual attendance recording
- **Notifications**: Scheduled push notifications via Firebase Cloud Messaging
- **Social Feed**: Posts, comments, and reactions system
- **Daily Content**: 365 daily quotes for youth and church fathers
- **Analytics**: Comprehensive reports and data visualization
- **PWA Support**: Offline functionality and mobile app installation
- **RTL Support**: Full Arabic language support with right-to-left layout

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, FCM)
- **PWA**: Service Worker, Web App Manifest
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- Firebase CLI installed (\`npm install -g firebase-tools\`)
- A Firebase project created
- Vercel account for deployment

## Environment Variables

Create a \`.env.local\` file in the root directory with the following variables:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for Cloud Functions)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# Vercel Configuration
VERCEL_URL=your-app.vercel.app
\`\`\`

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable Google and Facebook providers
3. Add your domain to authorized domains
4. For Facebook: Add your Facebook App ID and secret

### 3. Create Firestore Database

1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (use the provided \`firestore.rules\`)

### 4. Enable Storage

1. Go to Storage
2. Get started with default rules
3. Update rules with provided \`storage.rules\`

### 5. Enable Cloud Messaging

1. Go to Cloud Messaging
2. Generate a new key pair for VAPID
3. Add the public key to your web app configuration

### 6. Set up Cloud Functions

1. Navigate to the \`firebase/functions\` directory
2. Run \`npm install\`
3. Deploy functions: \`firebase deploy --only functions\`

### 7. Generate Service Account Key

1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Use the values in your environment variables

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd church-youth-pwa
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables (see above)

4. Seed initial data:
\`\`\`bash
npm run seed:quotes
npm run seed:members
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### 1. Connect to Vercel

1. Install Vercel CLI: \`npm install -g vercel\`
2. Run \`vercel\` in your project directory
3. Follow the prompts to connect your project

### 2. Set Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Add all environment variables from \`.env.local\`
3. Make sure to properly format the private key

### 3. Deploy

\`\`\`bash
vercel --prod
\`\`\`

### 4. Update Firebase Configuration

1. Add your Vercel domain to Firebase authorized domains
2. Update OAuth redirect URIs in Google/Facebook developer consoles

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── members/           # Member management
│   ├── attendance/        # Attendance tracking
│   ├── notifications/     # Notification system
│   ├── posts/            # Social feed
│   ├── daily-quotes/     # Daily quotes
│   ├── analytics/        # Reports and analytics
│   └── settings/         # App settings
├── components/           # Reusable components
│   ├── ui/              # UI components
│   └── layout/          # Layout components
├── lib/                 # Utility functions
├── firebase/            # Firebase configuration
│   └── functions/       # Cloud Functions
├── public/              # Static assets
├── scripts/             # Seed scripts
└── types/               # TypeScript types
\`\`\`

## Key Features Implementation

### Authentication & Roles

- Firebase Authentication with Google/Facebook
- Custom claims for admin/member roles
- Server-side role verification

### Attendance System

- QR code generation for each member
- Camera-based QR scanning
- Manual attendance marking
- Automatic lateness calculation
- Offline attendance caching

### PWA Features

- Service Worker for offline functionality
- Web App Manifest for installation
- Background sync for attendance data
- Push notifications

### Security

- Firestore security rules
- Server-side validation
- Rate limiting on Cloud Functions
- Secure QR code signatures

## Testing

Run tests:
\`\`\`bash
npm test
\`\`\`

Run tests in watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

## Production Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] Cloud Functions deployed
- [ ] Domain added to Firebase authorized domains
- [ ] OAuth providers configured with production URLs
- [ ] PWA icons generated and optimized
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Backup strategy implemented

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## License

This project is licensed under the MIT License.
