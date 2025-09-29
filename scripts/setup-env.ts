import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = 'c:/Users/mixco/Downloads/member-elnosor-firebase-adminsdk-fbsvc-1c2ea65e42.json';

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountContent);

    console.log('✅ Service account JSON is valid!');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('');
    console.log('📋 Copy and paste this into your .env.local file:');
    console.log('');
    console.log(`FIREBASE_SERVICE_ACCOUNT_KEY=${JSON.stringify(serviceAccount)}`);
    console.log('');
    console.log('⚠️  Make sure the entire JSON is on a single line in your .env.local file');
  } else {
    console.error('❌ Service account file not found at:', serviceAccountPath);
    console.log('Please download the service account key from Firebase Console and place it at the correct path.');
  }
} catch (error) {
  console.error('❌ Error reading service account file:', error);
  console.log('Please ensure the JSON file is valid and accessible.');
}
