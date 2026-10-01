import { db } from './seedFirestoreAdmin.js';

async function cleanupStaleDemoRecords() {
  const teamsSnap = await db.collection('teams').get();
  const validTeamIds = new Set(teamsSnap.docs.map(d => d.id));
  console.log(`Valid teams in Firestore: ${validTeamIds.size}`);

  // Clean stale attendance docs
  const attSnap = await db.collection('attendance').get();
  let staleAttCount = 0;
  const attBatch = db.batch();

  attSnap.forEach(doc => {
    const data = doc.data();
    if (!validTeamIds.has(data.teamNumber)) {
      attBatch.delete(doc.ref);
      staleAttCount++;
    }
  });

  if (staleAttCount > 0) {
    await attBatch.commit();
    console.log(`🗑️ Deleted ${staleAttCount} stale attendance records from demo teams.`);
  } else {
    console.log('No stale attendance records found.');
  }

  // Clean stale audit logs if any reference demo teams
  const auditSnap = await db.collection('auditLogs').get();
  let staleAuditCount = 0;
  const auditBatch = db.batch();
  
  auditSnap.forEach(doc => {
    const data = doc.data();
    if (data.teamNumber && !validTeamIds.has(data.teamNumber)) {
      auditBatch.delete(doc.ref);
      staleAuditCount++;
    }
  });

  if (staleAuditCount > 0) {
    await auditBatch.commit();
    console.log(`🗑️ Deleted ${staleAuditCount} stale audit log records from demo teams.`);
  }
}

cleanupStaleDemoRecords().catch(console.error);
