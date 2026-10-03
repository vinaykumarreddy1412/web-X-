import { 
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, 
  query, where, writeBatch, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Team, Session, AttendanceRecord, AuditLog } from '../types';
import { generate70DemoTeams, generateDefaultSessions, generateSampleAttendance } from './seedService';

// Purge any legacy dummy data stored in localStorage from previous versions
const LEGACY_STORAGE_KEYS = [
  'webx_teams_db',
  'webx_sessions_db',
  'webx_attendance_db',
  'webx_audit_logs'
];

export const purgeLegacyLocalStorageData = () => {
  if (typeof window !== 'undefined') {
    LEGACY_STORAGE_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  }
};

// Immediately purge on module load
purgeLegacyLocalStorageData();

// Fast In-Memory Cache and Indexed Lookup Tables for Zero-Latency Access (hydrated solely from Firestore)
let cachedTeams: Team[] | null = null;
const teamsByNumberMap = new Map<string, Team>();
const teamsByQRTokenMap = new Map<string, Team>();
const teamsByLeadRegNoMap = new Map<string, Team>();
const teamsByMemberRegNoMap = new Map<string, Team>();

let cachedSessions: Session[] | null = null;
const sessionsByIdMap = new Map<string, Session>();

let cachedAttendance: AttendanceRecord[] | null = null;
const attendanceByIdMap = new Map<string, AttendanceRecord>();

export const sortTeamsNaturally = (teamList: Team[]): Team[] => {
  return [...teamList].sort((a, b) => {
    return (a.teamNumber || '').localeCompare(b.teamNumber || '', undefined, { 
      numeric: true, 
      sensitivity: 'base' 
    });
  });
};

export const indexTeams = (teams: Team[]) => {
  const sorted = sortTeamsNaturally(teams);
  cachedTeams = sorted;
  teamsByNumberMap.clear();
  teamsByQRTokenMap.clear();
  teamsByLeadRegNoMap.clear();
  teamsByMemberRegNoMap.clear();

  sorted.forEach(t => {
    if (t.teamNumber) {
      teamsByNumberMap.set(t.teamNumber.toUpperCase().trim(), t);
      teamsByNumberMap.set(t.teamNumber.toUpperCase().replace(/[\s-_]/g, ''), t);
    }
    if (t.qrToken) {
      teamsByQRTokenMap.set(t.qrToken.trim(), t);
    }
    if (t.teamLeadRegNo) {
      teamsByLeadRegNoMap.set(t.teamLeadRegNo.toUpperCase().trim(), t);
    }
    if (t.members && Array.isArray(t.members)) {
      t.members.forEach(m => {
        if (m.regNo) {
          teamsByMemberRegNoMap.set(m.regNo.toUpperCase().trim(), t);
        }
      });
    }
  });
};

export const indexSessions = (sessions: Session[]) => {
  cachedSessions = sessions;
  sessionsByIdMap.clear();
  sessions.forEach(s => {
    if (s.sessionId) {
      sessionsByIdMap.set(s.sessionId, s);
    }
  });
};

export const indexAttendance = (records: AttendanceRecord[]) => {
  cachedAttendance = records;
  attendanceByIdMap.clear();
  records.forEach(r => {
    const id = r.id || `${r.sessionId}_${r.teamNumber}`;
    attendanceByIdMap.set(id, r);
  });
};

// -------------------------------------------------------------
// TEAMS DATA ACCESS (SINGLE SOURCE OF TRUTH: FIRESTORE)
// -------------------------------------------------------------

export const fetchAllTeams = async (forceRefresh = false): Promise<Team[]> => {
  if (!forceRefresh && cachedTeams && cachedTeams.length > 0) {
    return cachedTeams;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    const teams: Team[] = [];
    querySnapshot.forEach(docSnap => {
      teams.push(docSnap.data() as Team);
    });
    indexTeams(teams);
    return teams;
  } catch (err) {
    console.error('Firestore fetch teams error:', err);
    if (cachedTeams) return cachedTeams;
    throw err;
  }
};

export const fetchTeamByNumber = async (teamNumber: string): Promise<Team | null> => {
  if (!teamNumber) return null;
  const clean = teamNumber.toUpperCase().trim();
  const normalized = clean.replace(/[\s-_]/g, '');

  // 1. Instant $O(1)$ memory lookup
  const inMem = teamsByNumberMap.get(clean) || teamsByNumberMap.get(normalized);
  if (inMem) return inMem;

  // 2. Query Firestore document directly
  try {
    const docRef = doc(db, 'teams', clean);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const team = docSnap.data() as Team;
      teamsByNumberMap.set(clean, team);
      return team;
    }

    // Try query by teamNumber field if document ID differed
    const q = query(collection(db, 'teams'), where('teamNumber', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const team = snap.docs[0].data() as Team;
      teamsByNumberMap.set(clean, team);
      return team;
    }
  } catch (err) {
    console.warn('Firestore fetch team by number error:', err);
  }

  return null;
};

export const fetchTeamByLeadRegNo = async (regNo: string): Promise<Team | null> => {
  if (!regNo) return null;
  const cleanRegNo = regNo.trim().toUpperCase();

  // 1. Instant $O(1)$ memory lookup
  const inMemLead = teamsByLeadRegNoMap.get(cleanRegNo);
  if (inMemLead) return inMemLead;
  const inMemMember = teamsByMemberRegNoMap.get(cleanRegNo);
  if (inMemMember) return inMemMember;

  // 2. Query Firestore
  try {
    const q = query(collection(db, 'teams'), where('teamLeadRegNo', '==', cleanRegNo));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const team = querySnapshot.docs[0].data() as Team;
      teamsByLeadRegNoMap.set(cleanRegNo, team);
      return team;
    }

    // Search all teams in memory/db if needed
    const all = await fetchAllTeams();
    const found = all.find(t => {
      if (t.teamLeadRegNo?.trim().toUpperCase() === cleanRegNo) return true;
      if (t.members && Array.isArray(t.members)) {
        return t.members.some(m => m.regNo?.trim().toUpperCase() === cleanRegNo);
      }
      return false;
    }) || null;

    if (found) {
      teamsByLeadRegNoMap.set(cleanRegNo, found);
    }
    return found;
  } catch (err) {
    console.warn('Firestore fetch team by regNo error:', err);
  }

  return null;
};

export const fetchTeamByQRToken = async (qrToken: string): Promise<Team | null> => {
  if (!qrToken) return null;
  const cleanToken = qrToken.trim();

  // 1. Instant $O(1)$ memory lookup
  const inMem = teamsByQRTokenMap.get(cleanToken);
  if (inMem) return inMem;

  // 2. Query Firestore
  try {
    const q = query(collection(db, 'teams'), where('qrToken', '==', cleanToken));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const team = querySnapshot.docs[0].data() as Team;
      teamsByQRTokenMap.set(cleanToken, team);
      return team;
    }

    const all = await fetchAllTeams();
    const found = all.find(t => t.qrToken?.trim() === cleanToken) || null;
    if (found) {
      teamsByQRTokenMap.set(cleanToken, found);
    }
    return found;
  } catch (err) {
    console.warn('Firestore fetch by QR token error:', err);
  }

  return null;
};

export const saveTeam = async (team: Team): Promise<void> => {
  await setDoc(doc(db, 'teams', team.teamNumber), team);
  if (cachedTeams) {
    const idx = cachedTeams.findIndex(t => t.teamNumber === team.teamNumber);
    if (idx >= 0) cachedTeams[idx] = team;
    else cachedTeams.push(team);
    indexTeams(cachedTeams);
  }
};

export const deleteTeam = async (teamNumber: string): Promise<void> => {
  await deleteDoc(doc(db, 'teams', teamNumber));
  if (cachedTeams) {
    cachedTeams = cachedTeams.filter(t => t.teamNumber !== teamNumber);
    indexTeams(cachedTeams);
  }
};

export const bulkSaveTeams = async (newTeams: Team[]): Promise<void> => {
  const batch = writeBatch(db);
  newTeams.forEach(t => {
    batch.set(doc(db, 'teams', t.teamNumber), t);
  });
  await batch.commit();

  if (cachedTeams) {
    const teamMap = new Map(cachedTeams.map(t => [t.teamNumber, t]));
    newTeams.forEach(t => teamMap.set(t.teamNumber, t));
    indexTeams(Array.from(teamMap.values()));
  }
};

// -------------------------------------------------------------
// SESSIONS DATA ACCESS (SINGLE SOURCE OF TRUTH: FIRESTORE)
// -------------------------------------------------------------

export const fetchAllSessions = async (forceRefresh = false): Promise<Session[]> => {
  if (!forceRefresh && cachedSessions && cachedSessions.length > 0) {
    return cachedSessions;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'sessions'));
    const sessions: Session[] = [];
    querySnapshot.forEach(docSnap => {
      sessions.push(docSnap.data() as Session);
    });
    indexSessions(sessions);
    return sessions;
  } catch (err) {
    console.error('Firestore fetch sessions error:', err);
    if (cachedSessions) return cachedSessions;
    throw err;
  }
};

export const saveSession = async (session: Session): Promise<void> => {
  await setDoc(doc(db, 'sessions', session.sessionId), session);
  if (cachedSessions) {
    const idx = cachedSessions.findIndex(s => s.sessionId === session.sessionId);
    if (idx >= 0) cachedSessions[idx] = session;
    else cachedSessions.push(session);
    indexSessions(cachedSessions);
  }
};

export const updateSessionStatus = async (sessionId: string, status: Session['status']): Promise<void> => {
  const sessions = await fetchAllSessions(true);
  const batch = writeBatch(db);

  if (status === 'active') {
    for (const s of sessions) {
      if (s.status === 'active' && s.sessionId !== sessionId) {
        s.status = 'closed';
        batch.set(doc(db, 'sessions', s.sessionId), s);
      }
    }
  }

  const target = sessions.find(s => s.sessionId === sessionId);
  if (target) {
    target.status = status;
    batch.set(doc(db, 'sessions', target.sessionId), target);
  }

  await batch.commit();
  indexSessions(sessions);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await deleteDoc(doc(db, 'sessions', sessionId));
  if (cachedSessions) {
    cachedSessions = cachedSessions.filter(s => s.sessionId !== sessionId);
    indexSessions(cachedSessions);
  }
};

// -------------------------------------------------------------
// ATTENDANCE DATA ACCESS (SINGLE SOURCE OF TRUTH: FIRESTORE)
// -------------------------------------------------------------

export const fetchAllAttendance = async (forceRefresh = false): Promise<AttendanceRecord[]> => {
  if (!forceRefresh && cachedAttendance && cachedAttendance.length > 0) {
    return cachedAttendance;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    const records: AttendanceRecord[] = [];
    querySnapshot.forEach(docSnap => {
      records.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
    });
    indexAttendance(records);
    return records;
  } catch (err) {
    console.error('Firestore fetch attendance error:', err);
    if (cachedAttendance) return cachedAttendance;
    throw err;
  }
};

export const fetchAttendanceBySessionAndTeam = async (sessionId: string, teamNumber: string): Promise<AttendanceRecord | null> => {
  const recordId = `${sessionId}_${teamNumber}`;
  
  // 1. In-memory lookup
  const inMem = attendanceByIdMap.get(recordId);
  if (inMem) return inMem;

  // 2. Firestore document lookup
  try {
    const docRef = doc(db, 'attendance', recordId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const rec = { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
      attendanceByIdMap.set(recordId, rec);
      return rec;
    }
  } catch (err) {
    console.warn('Firestore fetch record error:', err);
  }

  return null;
};

// Atomic record write: writes directly to specific Firestore doc
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<void> => {
  const recordId = record.id || `${record.sessionId}_${record.teamNumber}`;
  const dataToSave = { ...record, id: recordId };

  // Update memory synchronously for instant local feedback
  attendanceByIdMap.set(recordId, dataToSave);
  if (cachedAttendance) {
    const cIdx = cachedAttendance.findIndex(r => (r.id || `${r.sessionId}_${r.teamNumber}`) === recordId);
    if (cIdx >= 0) cachedAttendance[cIdx] = dataToSave;
    else cachedAttendance.push(dataToSave);
  }

  // Atomically persist to Firestore document
  await setDoc(doc(db, 'attendance', recordId), dataToSave);
};

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    querySnapshot.forEach(docSnap => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
    });
    return logs;
  } catch (err) {
    console.warn('Firestore fetch audit logs error:', err);
    return [];
  }
};

export const logAuditEvent = async (action: string, userId: string, role: string, details: string) => {
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    action,
    userId,
    role,
    timestamp: new Date().toISOString(),
    details
  };

  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (err) {
    console.warn('Firestore log audit event error:', err);
  }
};

// -------------------------------------------------------------
// EXPLICIT DEMO SEEDING (ADMIN ONLY ACTION, DIRECT TO FIRESTORE)
// -------------------------------------------------------------

export const seedAllDemoData = async () => {
  const demoTeams = generate70DemoTeams();
  const demoSessions = generateDefaultSessions();
  const demoAttendance = generateSampleAttendance(demoTeams, demoSessions);

  indexTeams(demoTeams);
  indexSessions(demoSessions);
  indexAttendance(demoAttendance);

  try {
    await bulkSaveTeams(demoTeams);
    for (const s of demoSessions) {
      await saveSession(s);
    }
    for (const a of demoAttendance) {
      await saveAttendanceRecord(a);
    }
    await logAuditEvent('SEED_DEMO_DATA', 'Admin', 'admin', 'Seeded 70 teams, 4 sessions, and sample attendance records.');
  } catch (e) {
    console.error('Firestore seed failed:', e);
    throw e;
  }

  return { teamsCount: demoTeams.length, sessionsCount: demoSessions.length, attendanceCount: demoAttendance.length };
};

// -------------------------------------------------------------
// ASSISTANT KEY VALIDATION
// -------------------------------------------------------------

export const validateAssistantKey = async (key: string): Promise<{
  success: boolean;
  session?: Session;
  message?: string;
  isClosed?: boolean;
}> => {
  const cleanKey = (key || '').trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, message: 'Please enter an Assistant Access Key.' };
  }

  const sessions = await fetchAllSessions(true);
  const matchedSession = sessions.find(s => (s.assistantKey || '').trim().toUpperCase() === cleanKey);

  if (!matchedSession) {
    return { success: false, message: 'Invalid Assistant Access Key' };
  }

  if (matchedSession.status !== 'active') {
    return { 
      success: false, 
      isClosed: true, 
      session: matchedSession,
      message: 'This attendance session is closed.' 
    };
  }

  return {
    success: true,
    session: matchedSession
  };
};

export const updateSessionAssistantKey = async (
  sessionId: string, 
  newKey: string
): Promise<{ success: boolean; message?: string }> => {
  const cleanKey = newKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'Assistant Access Key cannot be empty.' };
  }

  const sessions = await fetchAllSessions(true);
  const target = sessions.find(s => s.sessionId === sessionId);
  if (!target) {
    return { success: false, message: 'Session not found.' };
  }

  // Ensure uniqueness among active sessions
  if (target.status === 'active') {
    const conflict = sessions.find(
      s => s.sessionId !== sessionId && 
           s.status === 'active' && 
           (s.assistantKey || '').trim().toUpperCase() === cleanKey.toUpperCase()
    );
    if (conflict) {
      return { 
        success: false, 
        message: `The key "${cleanKey}" is already assigned to active session "${conflict.sessionName}". Each active session must have a unique key.` 
      };
    }
  }

  const prevKey = target.assistantKey || 'None';
  target.assistantKey = cleanKey;
  await saveSession(target);

  await logAuditEvent(
    'UPDATE_SESSION_KEY',
    'Admin',
    'admin',
    `Updated Assistant Key for session "${target.sessionName}" (${sessionId}): [${prevKey}] -> [${cleanKey}]`
  );

  return { success: true };
};

export const revokeSessionAssistantKey = async (
  sessionId: string
): Promise<{ success: boolean; message?: string }> => {
  const sessions = await fetchAllSessions(true);
  const target = sessions.find(s => s.sessionId === sessionId);
  if (!target) {
    return { success: false, message: 'Session not found.' };
  }

  const prevKey = target.assistantKey || 'None';
  target.assistantKey = '';
  await saveSession(target);

  await logAuditEvent(
    'REVOKE_SESSION_KEY',
    'Admin',
    'admin',
    `Revoked Assistant Key for session "${target.sessionName}" (${sessionId}). (Previous key: ${prevKey})`
  );

  return { success: true };
};
