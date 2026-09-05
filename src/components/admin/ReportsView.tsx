import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { exportSessionAttendanceToExcel, exportTeamSummaryToExcel } from '../../services/exportService';
import { GlassCard } from '../common/GlassCard';
import { Download, FileSpreadsheet } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { teams, sessions, attendanceRecords } = useAttendance();
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.sessionId || '');

  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId) || sessions[0];

  const sessionRecords = selectedSession 
    ? attendanceRecords.filter(r => r.sessionId === selectedSession.sessionId)
    : [];

  const teamsAttendedCount = sessionRecords.length;
  const teamsAbsentCount = Math.max(0, teams.length - teamsAttendedCount);

  let totalStudentsPresent = 0;
  let totalStudentsAbsent = 0;

  sessionRecords.forEach(r => {
    r.members.forEach(m => {
      if (m.status === 'present') totalStudentsPresent++;
      else totalStudentsAbsent++;
    });
  });

  const unrecordedStudents = teamsAbsentCount * 4;
  totalStudentsAbsent += unrecordedStudents;

  const totalStudents = teams.length * 4;
  const attendancePercentage = totalStudents > 0 
    ? ((totalStudentsPresent / totalStudents) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">ATTENDANCE REPORTS & EXCEL EXPORT</h2>
          <p className="text-xs font-semibold text-slate-500">
            Generate detailed session reports and team summaries in native Excel (.xlsx) format.
          </p>
        </div>

        <button
          onClick={() => exportTeamSummaryToExcel(teams, sessions, attendanceRecords)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all self-start"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EXPORT ALL TEAMS SUMMARY (EXCEL .XLSX)</span>
        </button>
      </div>

      <GlassCard glowAccent="blue" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-blue-600">SESSION REPORT</span>
            <h3 className="text-lg font-black text-slate-900">Session Attendance Metrics</h3>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              {sessions.map(s => (
                <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>
              ))}
            </select>

            {selectedSession && (
              <button
                onClick={() => exportSessionAttendanceToExcel(selectedSession, teams, attendanceRecords)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXCEL (.XLSX)</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Total Teams</p>
            <p className="text-xl font-black text-slate-900 mt-1">{teams.length}</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-emerald-600 uppercase">Teams Attended</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{teamsAttendedCount}</p>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-red-600 uppercase">Teams Absent</p>
            <p className="text-xl font-black text-red-700 mt-1">{teamsAbsentCount}</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-emerald-600 uppercase">Students Present</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{totalStudentsPresent}</p>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-red-600 uppercase">Students Absent</p>
            <p className="text-xl font-black text-red-700 mt-1">{totalStudentsAbsent}</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-blue-600 uppercase">Attendance %</p>
            <p className="text-xl font-black text-blue-700 mt-1">{attendancePercentage}%</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard glowAccent="purple" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">TEAM-WISE ATTENDANCE BREAKDOWN</h3>
          <span className="text-xs font-bold text-slate-500">{teams.length} Teams Enrolled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="py-3 px-4">Team Number</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Team Lead</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4 text-right">Overall Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {teams.map(team => {
                let teamPossible = sessions.length * 4;
                let teamPresent = 0;

                const recordMap = new Map<string, any>();
                attendanceRecords.filter(r => r.teamNumber === team.teamNumber).forEach(r => recordMap.set(r.sessionId, r));

                sessions.forEach(sess => {
                  const rec = recordMap.get(sess.sessionId);
                  if (rec) {
                    teamPresent += rec.members.filter((m: any) => m.status === 'present').length;
                  }
                });

                const pct = teamPossible > 0 ? ((teamPresent / teamPossible) * 100).toFixed(0) + '%' : '0%';

                return (
                  <tr key={team.teamNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-900">{team.teamNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{team.teamName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{team.teamLeadName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">4 Students</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {pct}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
