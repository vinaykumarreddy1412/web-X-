import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tData, sData, aData, logData] = await Promise.all([
        fetchAllTeams(),
        fetchAllSessions(),
        fetchAllAttendance(),
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
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeSession = sessions.find(s => s.status === 'active') || null;

  const markTeamAttendance = async (
    sessionId: string,
    teamNumber: string,
    membersStatus: { name: string; regNo: string; status: 'present' | 'absent' }[],
    markedBy: string
  ) => {
    // Session isolation check: ensure session is active
    const targetSession = sessions.find(s => s.sessionId === sessionId);
    if (!targetSession || targetSession.status !== 'active') {
      return { 
        success: false, 
        message: 'Cannot record attendance: This attendance session is currently closed or inactive.' 
      };
    }

    const existing = attendanceRecords.find(r => r.sessionId === sessionId && r.teamNumber === teamNumber);
    if (existing) {
      return { success: false, isDuplicate: true, message: `Attendance for Team ${teamNumber} in this session has already been recorded.` };
    }

    const record: AttendanceRecord = {
      id: `${sessionId}_${teamNumber}`,
      sessionId,
      teamNumber,
      markedAt: new Date().toISOString(),
      markedBy,
      members: membersStatus
    };

    await saveAttendanceRecord(record);
    await logAuditEvent('MARK_ATTENDANCE', markedBy, 'assistant', `Marked attendance for Team ${teamNumber} in Session ${sessionId}`);
    await loadAll();

    return { success: true };
  };

  const adminUpdateAttendance = async (
    sessionId: string,
    teamNumber: string,
    regNo: string,
    newStatus: 'present' | 'absent',
    updatedBy: string
  ) => {
    let record = attendanceRecords.find(r => r.sessionId === sessionId && r.teamNumber === teamNumber);

    if (!record) {
      const team = teams.find(t => t.teamNumber === teamNumber);
      if (!team) return;

      const membersStatus = team.members.map(m => ({
        name: m.name,
        regNo: m.regNo,
        status: m.regNo === regNo ? newStatus : ('absent' as const)
      }));

      record = {
        id: `${sessionId}_${teamNumber}`,
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

      await logAuditEvent(
        'EDIT_ATTENDANCE',
        updatedBy,
        'admin',
        `Changed attendance for ${regNo} in Team ${teamNumber} (${sessionId}): ${prevStatus} -> ${newStatus}`
      );
    }

    await saveAttendanceRecord(record);
    await loadAll();
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

    await saveSession({ ...session, assistantKey: key });
    await logAuditEvent('SAVE_SESSION', session.createdBy, 'admin', `Saved session ${session.sessionId} - ${session.sessionName} (Key: ${key})`);
    await loadAll();
    return { success: true };
  };

  const changeSessionKey = async (sessionId: string, newKey: string): Promise<{ success: boolean; message?: string }> => {
    const res = await updateSessionAssistantKey(sessionId, newKey);
    if (res.success) {
      await loadAll();
    }
    return res;
  };

  const revokeSessionKey = async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    const res = await revokeSessionAssistantKey(sessionId);
    if (res.success) {
      await loadAll();
    }
    return res;
  };

  const setSessionStatus = async (sessionId: string, status: Session['status']) => {
    await updateSessionStatus(sessionId, status);
    await logAuditEvent('CHANGE_SESSION_STATUS', 'Admin', 'admin', `Changed status of session ${sessionId} to ${status}`);
    await loadAll();
  };

  const removeSession = async (sessionId: string) => {
    await deleteSessionService(sessionId);
    await logAuditEvent('DELETE_SESSION', 'Admin', 'admin', `Deleted session ${sessionId}`);
    await loadAll();
  };

  const createOrUpdateTeam = async (team: Team) => {
    await saveTeam(team);
    await logAuditEvent('SAVE_TEAM', 'Admin', 'admin', `Saved team ${team.teamNumber} - ${team.teamName}`);
    await loadAll();
  };

  const removeTeam = async (teamNumber: string) => {
    await deleteTeam(teamNumber);
    await logAuditEvent('DELETE_TEAM', 'Admin', 'admin', `Deleted team ${teamNumber}`);
    await loadAll();
  };

  const importTeamsFromCSV = async (newTeams: Team[]) => {
    await bulkSaveTeams(newTeams);
    await logAuditEvent('IMPORT_TEAMS_CSV', 'Admin', 'admin', `Imported ${newTeams.length} teams from CSV file.`);
    await loadAll();
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
