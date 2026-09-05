export type MemberRole = 'Team Lead' | 'Member';

export interface TeamMember {
  name: string;
  regNo: string;
  role: MemberRole;
}

export interface Team {
  teamNumber: string;
  teamName: string;
  teamLeadRegNo: string;
  teamLeadName: string;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export type SessionStatus = 'draft' | 'active' | 'closed';

export interface Session {
  sessionId: string;
  sessionName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: SessionStatus;
  createdAt: string;
  createdBy: string;
  assistantKey: string;
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceMember {
  name: string;
  regNo: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id?: string; // format: SESSIONID_TEAMNUMBER
  sessionId: string;
  teamNumber: string;
  markedAt: string;
  markedBy: string;
  members: AttendanceMember[];
  editedAt?: string;
  editedBy?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  role: string;
  timestamp: string;
  details: string;
}

export type UserRole = 'student' | 'assistant' | 'admin' | null;

export interface AuthUser {
  role: UserRole;
  teamNumber?: string;
  teamName?: string;
  teamLeadRegNo?: string;
  teamLeadName?: string;
  username?: string;
  email?: string;
  uid?: string;
  assignedSessionId?: string;
  assignedSessionName?: string;
  assistantKey?: string;
}
