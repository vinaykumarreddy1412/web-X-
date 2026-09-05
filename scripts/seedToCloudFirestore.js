import { db } from './seedFirestoreAdmin.js';
import crypto from 'crypto';

const generateSecureQRToken = (teamNumber) => {
  const hash = crypto.createHash('sha256').update(`${teamNumber}_WEBX2026_SECRET_SALT`).digest('hex').substring(0, 16);
  return `WEBX_TOK_${teamNumber}_${hash}`;
};

const teams = [];
for (let i = 1; i <= 70; i++) {
  const teamNum = `TEAM${i.toString().padStart(3, '0')}`;
  const leadRegNo = `22CSE${(1000 + i).toString()}`;
  
  teams.push({
    teamNumber: teamNum,
    teamName: `Team ${i}`,
    teamLeadRegNo: leadRegNo,
    teamLeadName: `Student Lead ${i}`,
    qrToken: generateSecureQRToken(teamNum),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      { name: `Student Lead ${i}`, regNo: leadRegNo, role: 'Team Lead' },
      { name: `Member A${i}`, regNo: `22CSE${(1100 + i).toString()}`, role: 'Member' },
      { name: `Member B${i}`, regNo: `22CSE${(1200 + i).toString()}`, role: 'Member' },
      { name: `Member C${i}`, regNo: `22CSE${(1300 + i).toString()}`, role: 'Member' }
    ]
  });
}

const defaultSessions = [
  {
    sessionId: 'SESS_01',
    sessionName: 'Session 1: Inauguration & Check-in',
    status: 'closed',
    date: '2026-09-02',
    startTime: '09:00',
    endTime: '11:00',
    createdAt: new Date().toISOString()
  },
  {
    sessionId: 'SESS_02',
    sessionName: 'Session 2: Mentorship Review 1',
    status: 'open',
    date: '2026-09-02',
    startTime: '14:00',
    endTime: '17:00',
    createdAt: new Date().toISOString()
  },
  {
    sessionId: 'SESS_03',
    sessionName: 'Session 3: Midnight Progress Evaluation',
    status: 'closed',
    date: '2026-09-03',
    startTime: '00:00',
    endTime: '02:00',
    createdAt: new Date().toISOString()
  },
  {
    sessionId: 'SESS_04',
    sessionName: 'Session 4: Final Submission & Pitching',
    status: 'closed',
    date: '2026-09-03',
    startTime: '09:00',
    endTime: '12:00',
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('Seeding 70 teams to Cloud Firestore...');
  const batch1 = db.batch();
  teams.forEach(team => {
    const ref = db.collection('teams').doc(team.teamNumber);
    batch1.set(ref, team);
  });
  await batch1.commit();
  console.log('✅ 70 Teams committed to Cloud Firestore.');

  console.log('Seeding Sessions to Cloud Firestore...');
  const batch2 = db.batch();
  defaultSessions.forEach(session => {
    const ref = db.collection('sessions').doc(session.sessionId);
    batch2.set(ref, session);
  });
  await batch2.commit();
  console.log('✅ Sessions committed to Cloud Firestore.');

  console.log('🎉 Cloud Firestore Database is now fully initialized with 70 teams, 280 students, and sessions!');
}

seed().catch(console.error);
