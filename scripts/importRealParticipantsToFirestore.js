import { db } from './seedFirestoreAdmin.js';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateSecureQRToken = (teamNumber) => {
  const hash = crypto.createHash('sha256').update(`${teamNumber}_WEBX2026_SECRET_SALT`).digest('hex').substring(0, 16);
  return `WEBX_TOK_${teamNumber}_${hash}`;
};

async function syncRealTeams() {
  const jsonPath = join(__dirname, 'cleaned_participants.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const realTeams = JSON.parse(rawData);

  console.log(`Loaded ${realTeams.length} real teams from cleaned JSON.`);

  // 1. Fetch existing teams in Firestore to remove old dummy/demo teams
  const existingTeamsSnap = await db.collection('teams').get();
  console.log(`Found ${existingTeamsSnap.size} existing teams in Firestore.`);

  const realTeamIds = new Set(realTeams.map(t => t.teamNumber));
  
  // Delete demo/old teams not in the real team list
  let deletedCount = 0;
  const deleteBatch = db.batch();
  for (const doc of existingTeamsSnap.docs) {
    if (!realTeamIds.has(doc.id)) {
      console.log(`Removing demo/old team: ${doc.id} (${doc.data().teamName})`);
      deleteBatch.delete(doc.ref);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    await deleteBatch.commit();
    console.log(`🗑️ Deleted ${deletedCount} demo / old teams from Firestore.`);
  }

  // 2. Insert/Update the 60 real teams
  const writeBatch = db.batch();
  realTeams.forEach(team => {
    const ref = db.collection('teams').doc(team.teamNumber);
    writeBatch.set(ref, {
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      teamLeadName: team.teamLeadName,
      teamLeadRegNo: team.teamLeadRegNo,
      teamLeadEmail: team.teamLeadEmail,
      paymentStatus: team.paymentStatus,
      utr: team.utr,
      qrToken: generateSecureQRToken(team.teamNumber),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: team.members.map(m => ({
        name: m.name,
        regNo: m.regNo,
        role: m.role,
        gender: m.gender,
        department: m.department,
        year: m.year,
        section: m.section,
        mobile: m.mobile,
        email: m.email,
        accommodation: m.accommodation,
        hostel: m.hostel,
        roomNo: m.roomNo
      }))
    });
  });

  await writeBatch.commit();
  console.log(`✅ Successfully synced ${realTeams.length} real teams (240 participants) to Cloud Firestore.`);
}

syncRealTeams().catch(err => {
  console.error('Error syncing real teams:', err);
  process.exit(1);
});
