import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Team, Session, AttendanceRecord, AuditLog } from '../types';
import { 
  fetchAllTeams, fetchAllSessions, fetchAllAttendance, fetchAuditLogs, 
  saveAttendanceRecord, updateSessionStatus, saveSession, saveTeam, deleteTeam, bulkSaveTeams,
  deleteSession as deleteSessionService, updateSessionAssistantKey, revokeSessionAssistantKey,
  logAuditEvent, seedAllDemoData, indexTeams, indexSessions, indexAttendance, sortTeamsNaturally
} from '../services/firebaseService';

interface AttendanceContextType {
  teams: Team[];
  sessions: Session[];
  attendanceRecords: AttendanceRecord[];
  activeSession: Session | null;
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // Manual one-time revalidation fetch
  const loadAll = useCallback(async () => {
    try {
      const [tData, sData, aData, logData] = await Promise.allSettled([
        fetchAllTeams(true),
        fetchAllSessions(true),
        fetchAllAttendance(true),
        fetchAuditLogs()
      ]);

      let hasSuccess = false;
      if (tData.status === 'fulfilled' && tData.value.length > 0) {
        setTeams(tData.value);
        indexTeams(tData.value);
        hasSuccess = true;
      }
      if (sData.status === 'fulfilled') {
        setSessions(sData.value);
        indexSessions(sData.value);
        if (sData.value.length > 0) hasSuccess = true;
      }
      if (aData.status === 'fulfilled') {
        setAttendanceRecords(aData.value);
        indexAttendance(aData.value);
      }
      if (logData.status === 'fulfilled') {
        setAuditLogs(logData.value);
      }

      if (hasSuccess) {
        setError(null);
      }
    } catch (e) {
      console.warn('Revalidation notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Multi-Device Real-Time Firestore Synchronization
  useEffect(() => {
    let unsubTeams: (() => void) | null = null;
    let unsubSessions: (() => void) | null = null;
    let unsubAttendance: (() => void) | null = null;
    let unsubLogs: (() => void) | null = null;

    try {
      // 1. Live Teams Listener
      unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
        const teamList: Team[] = [];
        snapshot.forEach(docSnap => {
          teamList.push(docSnap.data() as Team);
        });
        const sorted = sortTeamsNaturally(teamList);
        setTeams(sorted);
        indexTeams(sorted);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.warn('Teams live listener warning:', err);
      });

      // 2. Live Sessions Listener
      unsubSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
        const sessList: Session[] = [];
        snapshot.forEach(docSnap => {
          sessList.push(docSnap.data() as Session);
        });
        setSessions(sessList);
        indexSessions(sessList);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.warn('Sessions live listener warning:', err);
      });

      // 3. Live Attendance Listener (Instant multi-device attendance sync)
      unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          records.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
        });
        setAttendanceRecords(records);
        indexAttendance(records);
        setError(null);
      }, (err) => {
        console.warn('Attendance live listener warning:', err);
      });

      // 4. Live Audit Logs Listener
      unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
        const logs: AuditLog[] = [];
        snapshot.forEach(docSnap => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
        });
        setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, (err) => {
        console.warn('Audit logs listener warning:', err);
      });

    } catch (e) {
      console.warn('Real-time listener setup warning:', e);
      loadAll();
    }

    return () => {
      if (unsubTeams) unsubTeams();
      if (unsubSessions) unsubSessions();
      if (unsubAttendance) unsubAttendance();
      if (unsubLogs) unsubLogs();
    };
  }, [loadAll]);

  // Derived active session always in sync with live Firestore database
  const activeSession = useMemo(() => sessions.find(s => s.status === 'active') || null, [sessions]);

  // Atomic & safe attendance write: concurrent updates from multiple assistants
  const markTeamAttendance = async (
    sessionId: string,
    teamNumber: string,
    membersStatus: { name: string; regNo: string; status: 'present' | 'absent' }[],
    markedBy: string
  ) => {
    // 1. Session status check from current live state
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

    // 4. Optimistic state update (Instant UI feedback)
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => (r.id || `${r.sessionId}_${r.teamNumber}`) !== recordId);
      return [record, ...filtered];
    });

    // 5. Persist directly to Firestore document (atomic write)
    try {
      await saveAttendanceRecord(record);
      logAuditEvent('MARK_ATTENDANCE', markedBy, 'assistant', `Marked attendance for Team ${teamNumber} in Session ${sessionId}`);
      return { success: true };
    } catch (err: any) {
      console.error('Error saving attendance record:', err);
      return { success: false, message: 'Unable to save attendance to database. Please check your connection and try again.' };
    }
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
    // 1. Instant 0ms Optimistic State Update
    setSessions(prev => {
      const updated = prev.map(s => {
        if (status === 'active') {
          if (s.sessionId === sessionId) return { ...s, status: 'active' as const };
          if (s.status === 'active') return { ...s, status: 'closed' as const };
        } else if (s.sessionId === sessionId) {
          return { ...s, status };
        }
        return s;
      });
      indexSessions(updated);
      return updated;
    });

    // 2. Fast background persist to Firestore
    try {
      await updateSessionStatus(sessionId, status);
      logAuditEvent('CHANGE_SESSION_STATUS', 'Admin', 'admin', `Changed status of session ${sessionId} to ${status}`);
    } catch (err) {
      console.error('Failed to persist session status update:', err);
    }
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
      return sortTeamsNaturally([...filtered, team]);
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
      error,
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
