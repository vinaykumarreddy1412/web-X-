import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { GlassCard } from '../common/GlassCard';
import { Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { AttendanceStatus } from '../../types';

export const AttendanceManager: React.FC = () => {
  const { teams, sessions, attendanceRecords, adminUpdateAttendance } = useAttendance();

  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allFlattenedRecords: Array<{
    sessionId: string;
    sessionName: string;
    teamNumber: string;
    teamName: string;
    regNo: string;
    studentName: string;
    role: string;
    status: 'present' | 'absent' | 'Not Marked';
    markedAt?: string;
  }> = [];

  const recordMap = new Map<string, any>();
  attendanceRecords.forEach(r => recordMap.set(`${r.sessionId}_${r.teamNumber}`, r));

  const targetSessions = selectedSessionId === 'all' 
    ? sessions 
    : sessions.filter(s => s.sessionId === selectedSessionId);

  targetSessions.forEach(sess => {
    teams.forEach(team => {
      const record = recordMap.get(`${sess.sessionId}_${team.teamNumber}`);
      const memberStatusMap = new Map<string, 'present' | 'absent'>();
      if (record) {
        record.members.forEach((m: any) => memberStatusMap.set(m.regNo, m.status));
      }

      team.members.forEach(m => {
        const status = record ? (memberStatusMap.get(m.regNo) || 'absent') : 'Not Marked';

        if (selectedStatusFilter !== 'all' && status !== selectedStatusFilter) return;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = team.teamNumber.toLowerCase().includes(q) ||
            team.teamName.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.regNo.toLowerCase().includes(q) ||
            sess.sessionName.toLowerCase().includes(q);
          if (!match) return;
        }

        allFlattenedRecords.push({
          sessionId: sess.sessionId,
          sessionName: sess.sessionName,
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          regNo: m.regNo,
          studentName: m.name,
          role: m.role,
          status,
          markedAt: record?.markedAt
        });
      });
    });
  });

  const handleToggleStatus = async (item: typeof allFlattenedRecords[0]) => {
    const newStatus: AttendanceStatus = item.status === 'present' ? 'absent' : 'present';
    await adminUpdateAttendance(item.sessionId, item.teamNumber, item.regNo, newStatus, 'Admin');
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">ATTENDANCE RECORDS AUDIT</h2>
          <p className="text-xs font-semibold text-slate-500">
            Real-time individual attendance records with admin edit overrides.
          </p>
        </div>
      </div>

      <GlassCard glowAccent="cyan" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search team, student name, or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
            >
              <option value="all">All Sessions ({sessions.length})</option>
              {sessions.map(s => (
                <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
              <option value="Not Marked">Not Marked Only</option>
            </select>
          </div>

        </div>
      </GlassCard>

      <GlassCard glowAccent="blue" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-extrabold text-slate-700">
            Showing {allFlattenedRecords.length} student attendance rows
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Reg No.</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {allFlattenedRecords.slice(0, 100).map((row, idx) => (
                <tr key={`${row.sessionId}_${row.teamNumber}_${row.regNo}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-slate-900">{row.teamNumber}</span>
                    <span className="text-[10px] text-slate-500 block">{row.teamName}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.studentName}
                    {row.role === 'Team Lead' && (
                      <span className="ml-1.5 px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded">
                        Lead
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-600">
                    {row.regNo}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-700 max-w-[180px] truncate">
                    {row.sessionName}
                  </td>

                  <td className="py-3 px-4">
                    {row.status === 'present' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Present</span>
                      </span>
                    )}
                    {row.status === 'absent' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        <span>Absent</span>
                      </span>
                    )}
                    {row.status === 'Not Marked' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span>Not Marked</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(row)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-extrabold text-[11px] rounded-lg transition-colors border border-slate-200"
                    >
                      {row.status === 'present' ? 'Mark Absent' : 'Mark Present'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {allFlattenedRecords.length > 100 && (
            <p className="p-3 text-center text-xs font-bold text-slate-400 bg-slate-50 border-t border-slate-100">
              Showing first 100 rows of {allFlattenedRecords.length}. Use search or filters to refine.
            </p>
          )}
        </div>
      </GlassCard>

    </div>
  );
};
