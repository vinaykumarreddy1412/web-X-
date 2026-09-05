import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '..', 'attendence-web-x-firebase-adminsdk-fbsvc-b3657af9c3.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = !getApps().length ? initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
}) : getApps()[0];

const db = getFirestore(app);

console.log(`✅ Successfully connected to Firebase Project: "${serviceAccount.project_id}" using service account "${serviceAccount.client_email}"!`);

export { app, db };
