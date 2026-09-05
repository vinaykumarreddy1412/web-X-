import { 
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, 
  query, where, writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Team, Session, AttendanceRecord, AuditLog } from '../types';
import { generate70DemoTeams, generateDefaultSessions, generateSampleAttendance } from './seedService';

const LOCAL_TEAMS_KEY = 'webx_teams_db';
const LOCAL_SESSIONS_KEY = 'webx_sessions_db';
const LOCAL_ATTENDANCE_KEY = 'webx_attendance_db';
const LOCAL_LOGS_KEY = 'webx_audit_logs';

const getLocal = <T>(key: string, defaultData: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch {
    return defaultData;
  }
};

const setLocal = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage set error', e);
  }
};

export const initLocalDatabaseIfEmpty = () => {
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  if (!teams || teams.length === 0) {
    const demoTeams = generate70DemoTeams();
    const demoSessions = generateDefaultSessions();
    const demoAttendance = generateSampleAttendance(demoTeams, demoSessions);
    setLocal(LOCAL_TEAMS_KEY, demoTeams);
    setLocal(LOCAL_SESSIONS_KEY, demoSessions);
    setLocal(LOCAL_ATTENDANCE_KEY, demoAttendance);
  }
};

initLocalDatabaseIfEmpty();

export const fetchAllTeams = async (): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    if (!querySnapshot.empty) {
      const teams: Team[] = [];
      querySnapshot.forEach(doc => teams.push(doc.data() as Team));
      setLocal(LOCAL_TEAMS_KEY, teams);
      return teams;
    }
  } catch (err) {
    console.warn('Firestore fetch teams fallback to LocalStorage:', err);
  }
  return getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
};

export const fetchTeamByNumber = async (teamNumber: string): Promise<Team | null> => {
  try {
    const docRef = doc(db, 'teams', teamNumber.toUpperCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Team;
    }
  } catch (err) {
    console.warn('Firestore fetch team by number fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  return teams.find(t => t.teamNumber.toUpperCase() === teamNumber.toUpperCase()) || null;
};

export const fetchTeamByLeadRegNo = async (regNo: string): Promise<Team | null> => {
  const cleanRegNo = regNo.trim().toUpperCase();
  try {
    const q = query(collection(db, 'teams'), where('teamLeadRegNo', '==', cleanRegNo));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Team;
    }
  } catch (err) {
    console.warn('Firestore fetch team by regNo fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  return teams.find(t => t.teamLeadRegNo.trim().toUpperCase() === cleanRegNo) || null;
};

export const fetchTeamByQRToken = async (qrToken: string): Promise<Team | null> => {
  try {
    const q = query(collection(db, 'teams'), where('qrToken', '==', qrToken.trim()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Team;
    }
  } catch (err) {
    console.warn('Firestore fetch by QR token fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  return teams.find(t => t.qrToken.trim() === qrToken.trim()) || null;
};

export const saveTeam = async (team: Team): Promise<void> => {
  try {
    await setDoc(doc(db, 'teams', team.teamNumber), team);
  } catch (err) {
    console.warn('Firestore save team fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  const index = teams.findIndex(t => t.teamNumber === team.teamNumber);
  if (index >= 0) teams[index] = team;
  else teams.push(team);
  setLocal(LOCAL_TEAMS_KEY, teams);
};

export const deleteTeam = async (teamNumber: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teams', teamNumber));
  } catch (err) {
    console.warn('Firestore delete team fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  setLocal(LOCAL_TEAMS_KEY, teams.filter(t => t.teamNumber !== teamNumber));
};

export const bulkSaveTeams = async (newTeams: Team[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    newTeams.forEach(t => {
      batch.set(doc(db, 'teams', t.teamNumber), t);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore bulk save fallback:', err);
  }
  const teams = getLocal<Team[]>(LOCAL_TEAMS_KEY, []);
  const teamMap = new Map(teams.map(t => [t.teamNumber, t]));
  newTeams.forEach(t => teamMap.set(t.teamNumber, t));
  setLocal(LOCAL_TEAMS_KEY, Array.from(teamMap.values()));
};

export const fetchAllSessions = async (): Promise<Session[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sessions'));
    if (!querySnapshot.empty) {
      const sessions: Session[] = [];
      querySnapshot.forEach(doc => sessions.push(doc.data() as Session));
      setLocal(LOCAL_SESSIONS_KEY, sessions);
      return sessions;
    }
  } catch (err) {
    console.warn('Firestore fetch sessions fallback:', err);
  }
  return getLocal<Session[]>(LOCAL_SESSIONS_KEY, []);
};

export const saveSession = async (session: Session): Promise<void> => {
  try {
    await setDoc(doc(db, 'sessions', session.sessionId), session);
  } catch (err) {
    console.warn('Firestore save session fallback:', err);
  }
  const sessions = getLocal<Session[]>(LOCAL_SESSIONS_KEY, []);
  const index = sessions.findIndex(s => s.sessionId === session.sessionId);
  if (index >= 0) sessions[index] = session;
  else sessions.push(session);
  setLocal(LOCAL_SESSIONS_KEY, sessions);
};

export const updateSessionStatus = async (sessionId: string, status: Session['status']): Promise<void> => {
  const sessions = await fetchAllSessions();
  
  if (status === 'active') {
    for (const s of sessions) {
      if (s.status === 'active' && s.sessionId !== sessionId) {
        s.status = 'closed';
        await saveSession(s);
      }
    }
  }

  const target = sessions.find(s => s.sessionId === sessionId);
  if (target) {
    target.status = status;
    await saveSession(target);
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (err) {
    console.warn('Firestore delete session fallback:', err);
  }
  const sessions = getLocal<Session[]>(LOCAL_SESSIONS_KEY, []);
  setLocal(LOCAL_SESSIONS_KEY, sessions.filter(s => s.sessionId !== sessionId));
};

export const fetchAllAttendance = async (): Promise<AttendanceRecord[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    if (!querySnapshot.empty) {
      const records: AttendanceRecord[] = [];
      querySnapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setLocal(LOCAL_ATTENDANCE_KEY, records);
      return records;
    }
  } catch (err) {
    console.warn('Firestore fetch attendance fallback:', err);
  }
  return getLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
};

export const fetchAttendanceBySessionAndTeam = async (sessionId: string, teamNumber: string): Promise<AttendanceRecord | null> => {
  const recordId = `${sessionId}_${teamNumber}`;
  try {
    const docRef = doc(db, 'attendance', recordId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
    }
  } catch (err) {
    console.warn('Firestore fetch record fallback:', err);
  }
  const records = getLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  return records.find(r => r.sessionId === sessionId && r.teamNumber === teamNumber) || null;
};

export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<void> => {
  const recordId = `${record.sessionId}_${record.teamNumber}`;
  const dataToSave = { ...record, id: recordId };
  try {
    await setDoc(doc(db, 'attendance', recordId), dataToSave);
  } catch (err) {
    console.warn('Firestore save attendance record fallback:', err);
  }
  const records = getLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const index = records.findIndex(r => (r.id || `${r.sessionId}_${r.teamNumber}`) === recordId);
  if (index >= 0) records[index] = dataToSave;
  else records.push(dataToSave);
  setLocal(LOCAL_ATTENDANCE_KEY, records);
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'auditLogs'));
    if (!querySnapshot.empty) {
      const logs: AuditLog[] = [];
      querySnapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() } as AuditLog));
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (err) {
    console.warn('Firestore fetch audit logs fallback:', err);
  }
  const logs = getLocal<AuditLog[]>(LOCAL_LOGS_KEY, []);
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    console.warn('Firestore save audit log fallback:', err);
  }
  const logs = getLocal<AuditLog[]>(LOCAL_LOGS_KEY, []);
  logs.unshift(log);
  setLocal(LOCAL_LOGS_KEY, logs.slice(0, 200));
};

export const seedAllDemoData = async () => {
  const demoTeams = generate70DemoTeams();
  const demoSessions = generateDefaultSessions();
  const demoAttendance = generateSampleAttendance(demoTeams, demoSessions);

  setLocal(LOCAL_TEAMS_KEY, demoTeams);
  setLocal(LOCAL_SESSIONS_KEY, demoSessions);
  setLocal(LOCAL_ATTENDANCE_KEY, demoAttendance);

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
    console.warn('Firestore seed sync failed, saved to local database', e);
  }

  return { teamsCount: demoTeams.length, sessionsCount: demoSessions.length, attendanceCount: demoAttendance.length };
};

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

  const sessions = await fetchAllSessions();
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

  const sessions = await fetchAllSessions();
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
  const sessions = await fetchAllSessions();
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


