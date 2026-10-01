import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Team, Session, AttendanceRecord, AuditLog } from '../types';
import { 
  fetchAllTeams, fetchAllSessions, fetchAllAttendance, fetchAuditLogs, 
  saveAttendanceRecord, updateSessionStatus, saveSession, saveTeam, deleteTeam, bulkSaveTeams,
  deleteSession as deleteSessionService, updateSessionAssistantKey, revokeSessionAssistantKey,
  logAuditEvent, seedAllDemoData 
} from '../services/firebaseService';

interface AttendanceContextType {
  teams: Team[];
  sessions: Session[];
  attendanceRecords: AttendanceRecord[];
  activeSession: Session | null;
  auditLogs: AuditLog[];
  loading: boolean;
  refreshData: () => Promise<void>;
  markTeamAttendance: (sessionId: string, teamNumber: string, membersStatus: { name: string; regNo: string; status: 'present' | 'absent' }[], markedBy: string) => Promise<{ success: boolean; isDuplicate?: boolean; message?: string }>;
  adminUpdateAttendance: (sessionId: string, teamNumber: string, regNo: string, newStatus: 'present' | 'absent', updatedBy: string) => Promise<void>;
  createOrUpdateSession: (session: Session) => Promise<{ success: boolean; message?: string }>;
  changeSessionKey: (sessionId: string, newKey: string) => Promise<{ success: boolean; message?: string }>;
  revokeSessionKey: (sessionId: string) => Promise<{ success: boolean; message?: string }>;
  setSessionStatus: (sessionId: string, status: Session['status']) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
  createOrUpdateTeam: (team: Team) => Promise<void>;
  removeTeam: (teamNumber: string) => Promise<void>;
  importTeamsFromCSV: (teams: Team[]) => Promise<void>;
  seedDemoData: () => Promise<{ teamsCount: number; sessionsCount: number; attendanceCount: number }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial fast hydration from indexed cache and Firestore
  const loadAll = useCallback(async () => {
    try {
      const [tData, sData, aData, logData] = await Promise.all([
        fetchAllTeams(true),
        fetchAllSessions(true),
        fetchAllAttendance(true),
        fetchAuditLogs()
      ]);
      setTeams(tData);
      setSessions(sData);
      setAttendanceRecords(aData);
      setAuditLogs(logData);
    } catch (e) {
      console.error('Failed to load attendance context data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadAll();

    // Clean Real-Time Listeners with proper unmount cleanup to avoid duplicate reads
    let unsubAttendance: (() => void) | null = null;
    let unsubSessions: (() => void) | null = null;

    try {
      unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        if (!snapshot.empty) {
          const records: AttendanceRecord[] = [];
          snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
          });
          setAttendanceRecords(records);
        }
      }, (err) => {
        console.warn('Attendance live snapshot fallback:', err);
      });

      unsubSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
        if (!snapshot.empty) {
          const sessList: Session[] = [];
          snapshot.forEach(doc => {
            sessList.push(doc.data() as Session);
          });
          setSessions(sessList);
        }
      }, (err) => {
        console.warn('Sessions live snapshot fallback:', err);
      });
    } catch (e) {
      console.warn('Snapshot listener setup fallback:', e);
    }

    return () => {
      if (unsubAttendance) unsubAttendance();
      if (unsubSessions) unsubSessions();
    };
  }, [loadAll]);

  const activeSession = useMemo(() => sessions.find(s => s.status === 'active') || null, [sessions]);

  // High-performance attendance write: optimistic + atomic + zero full reloads
  const markTeamAttendance = async (
    sessionId: string,
    teamNumber: string,
    membersStatus: { name: string; regNo: string; status: 'present' | 'absent' }[],
    markedBy: string
  ) => {
    // 1. Session status check
    const targetSession = sessions.find(s => s.sessionId === sessionId);
    if (!targetSession || targetSession.status !== 'active') {
      return { 
        success: false, 
        message: 'Cannot record attendance: This attendance session is currently closed or inactive.' 
      };
    }

    // 2. Duplicate prevention check
    const recordId = `${sessionId}_${teamNumber}`;
    const existing = attendanceRecords.find(r => (r.id || `${r.sessionId}_${r.teamNumber}`) === recordId);
    if (existing) {
      return { 
        success: false, 
        isDuplicate: true, 
        message: `Attendance for Team ${teamNumber} in this session has already been recorded.` 
      };
    }

    // 3. Construct atomic record
    const record: AttendanceRecord = {
      id: recordId,
      sessionId,
      teamNumber,
      markedAt: new Date().toISOString(),
      markedBy,
      members: membersStatus
    };

    // 4. Optimistic state update (Instant 0ms UI feedback)
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => (r.id || `${r.sessionId}_${r.teamNumber}`) !== recordId);
      return [record, ...filtered];
    });

    // 5. Persist to Firestore & Local IndexedDB
    await saveAttendanceRecord(record);

    // 6. Non-blocking audit log
    logAuditEvent('MARK_ATTENDANCE', markedBy, 'assistant', `Marked attendance for Team ${teamNumber} in Session ${sessionId}`);

    return { success: true };
  };

  const adminUpdateAttendance = async (
    sessionId: string,
    teamNumber: string,
    regNo: string,
    newStatus: 'present' | 'absent',
    updatedBy: string
  ) => {
    const recordId = `${sessionId}_${teamNumber}`;
    let record = attendanceRecords.find(r => (r.id || `${r.sessionId}_${r.teamNumber}`) === recordId);

    if (!record) {
      const team = teams.find(t => t.teamNumber === teamNumber);
      if (!team) return;

      const membersStatus = team.members.map(m => ({
        name: m.name,
        regNo: m.regNo,
        status: m.regNo === regNo ? newStatus : ('absent' as const)
      }));

      record = {
        id: recordId,
        sessionId,
        teamNumber,
        markedAt: new Date().toISOString(),
        markedBy: updatedBy,
        members: membersStatus
      };
    } else {
      const prevStatus = record.members.find(m => m.regNo === regNo)?.status || 'absent';
      const updatedMembers = record.members.map(m => 
        m.regNo === regNo ? { ...m, status: newStatus } : m
      );

      record = {
        ...record,
        members: updatedMembers,
        editedAt: new Date().toISOString(),
        editedBy: updatedBy
      };

      logAuditEvent(
        'EDIT_ATTENDANCE',
        updatedBy,
        'admin',
        `Changed attendance for ${regNo} in Team ${teamNumber} (${sessionId}): ${prevStatus} -> ${newStatus}`
      );
    }

    const finalRecord = record;
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => (r.id || `${r.sessionId}_${r.teamNumber}`) !== recordId);
      return [finalRecord, ...filtered];
    });

    await saveAttendanceRecord(finalRecord);
  };

  const createOrUpdateSession = async (session: Session): Promise<{ success: boolean; message?: string }> => {
    const key = (session.assistantKey || '').trim().toUpperCase();
    if (!key) {
      return { success: false, message: 'Assistant Access Key is required.' };
    }

    // Uniqueness validation among active sessions
    if (session.status === 'active') {
      const conflict = sessions.find(
        s => s.sessionId !== session.sessionId && 
             s.status === 'active' && 
             (s.assistantKey || '').trim().toUpperCase() === key
      );
      if (conflict) {
        return { 
          success: false, 
          message: `The key "${key}" is already assigned to active session "${conflict.sessionName}". Each active session must have a unique key.` 
        };
      }
    }

    const updatedSession = { ...session, assistantKey: key };
    setSessions(prev => {
      const filtered = prev.filter(s => s.sessionId !== session.sessionId);
      return [...filtered, updatedSession];
    });

    await saveSession(updatedSession);
    logAuditEvent('SAVE_SESSION', session.createdBy, 'admin', `Saved session ${session.sessionId} - ${session.sessionName} (Key: ${key})`);
    return { success: true };
  };

  const changeSessionKey = async (sessionId: string, newKey: string): Promise<{ success: boolean; message?: string }> => {
    const res = await updateSessionAssistantKey(sessionId, newKey);
    if (res.success) {
      const updatedSessions = await fetchAllSessions(true);
      setSessions(updatedSessions);
    }
    return res;
  };

  const revokeSessionKey = async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    const res = await revokeSessionAssistantKey(sessionId);
    if (res.success) {
      const updatedSessions = await fetchAllSessions(true);
      setSessions(updatedSessions);
    }
    return res;
  };

  const setSessionStatus = async (sessionId: string, status: Session['status']) => {
    await updateSessionStatus(sessionId, status);
    logAuditEvent('CHANGE_SESSION_STATUS', 'Admin', 'admin', `Changed status of session ${sessionId} to ${status}`);
    const updatedSessions = await fetchAllSessions(true);
    setSessions(updatedSessions);
  };

  const removeSession = async (sessionId: string) => {
    await deleteSessionService(sessionId);
    logAuditEvent('DELETE_SESSION', 'Admin', 'admin', `Deleted session ${sessionId}`);
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  };

  const createOrUpdateTeam = async (team: Team) => {
    await saveTeam(team);
    logAuditEvent('SAVE_TEAM', 'Admin', 'admin', `Saved team ${team.teamNumber} - ${team.teamName}`);
    setTeams(prev => {
      const filtered = prev.filter(t => t.teamNumber !== team.teamNumber);
      return [...filtered, team];
    });
  };

  const removeTeam = async (teamNumber: string) => {
    await deleteTeam(teamNumber);
    logAuditEvent('DELETE_TEAM', 'Admin', 'admin', `Deleted team ${teamNumber}`);
    setTeams(prev => prev.filter(t => t.teamNumber !== teamNumber));
  };

  const importTeamsFromCSV = async (newTeams: Team[]) => {
    await bulkSaveTeams(newTeams);
    logAuditEvent('IMPORT_TEAMS_CSV', 'Admin', 'admin', `Imported ${newTeams.length} teams from CSV file.`);
    const updatedTeams = await fetchAllTeams(true);
    setTeams(updatedTeams);
  };

  const seedDemoData = async () => {
    const result = await seedAllDemoData();
    await loadAll();
    return result;
  };

  return (
    <AttendanceContext.Provider value={{
      teams,
      sessions,
      attendanceRecords,
      activeSession,
      auditLogs,
      loading,
      refreshData: loadAll,
      markTeamAttendance,
      adminUpdateAttendance,
      createOrUpdateSession,
      changeSessionKey,
      revokeSessionKey,
      setSessionStatus,
      removeSession,
      createOrUpdateTeam,
      removeTeam,
      importTeamsFromCSV,
      seedDemoData
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
