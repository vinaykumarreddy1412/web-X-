import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { QRCodeDisplay } from './QRCodeDisplay';
import { TeamMemberList } from './TeamMemberList';
import { StudentThemeAudio } from './StudentThemeAudio';
import { GlassCard } from '../common/GlassCard';
import { formatTimeRange } from '../../utils/timeFormatter';
import { Calendar, Radio, Clock, Users } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentTeam: authTeam } = useAuth();
  const { activeSession, sessions, attendanceRecords, teams, loading: teamsLoading } = useAttendance();

  const currentTeam = authTeam || (teams && teams.length > 0 ? teams[0] : null);

  if (teamsLoading && !currentTeam) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm">Loading Student Attendance Portal...</p>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <GlassCard glowAccent="red" className="space-y-4">
          <Users className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">No Team Found</h3>
          <p className="text-xs text-slate-500 font-medium">
            Your university account is not registered with any hackathon team. Please contact the administrator.
          </p>
        </GlassCard>
      </div>
    );
  }

  const activeRecord = activeSession 
    ? attendanceRecords.find(r => r.sessionId === activeSession.sessionId && r.teamNumber === currentTeam.teamNumber)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      <GlassCard glowAccent="blue" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider">
                {currentTeam.teamNumber}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">{currentTeam.teamName}</h2>
            </div>
            <p className="text-xs font-semibold text-slate-300 mt-1 flex items-center space-x-2">
              <span>Team Lead: <strong>{currentTeam.teamLeadName}</strong> ({currentTeam.teamLeadRegNo})</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StudentThemeAudio />

            {activeSession ? (
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center space-x-3 shadow-lg shadow-emerald-950/40">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">SESSION OPEN NOW</p>
                  <p className="text-xs font-black text-white">{activeSession.sessionName}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">SESSION CLOSED</p>
                  <p className="text-xs font-bold text-slate-200">No active attendance session.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-5">
          <QRCodeDisplay
            qrToken={currentTeam.qrToken}
            teamNumber={currentTeam.teamNumber}
            teamName={currentTeam.teamName}
          />
        </div>

        <div className="lg:col-span-7 space-y-6">
          <TeamMemberList
            teamNumber={currentTeam.teamNumber}
            members={currentTeam.members}
            attendanceMembers={activeRecord?.members}
            activeSessionName={activeSession?.sessionName}
          />

          <GlassCard glowAccent="cyan" className="w-full">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">ATTENDANCE SESSION HISTORY</h3>
            </div>

            <div className="space-y-2.5">
              {sessions.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 italic">No attendance sessions created yet.</p>
              ) : (
                sessions.map((sess) => {
                  const record = attendanceRecords.find(r => r.sessionId === sess.sessionId && r.teamNumber === currentTeam.teamNumber);
                  let presentCount = 0;
                  if (record) {
                    presentCount = record.members.filter(m => m.status === 'present').length;
                  }

                  return (
                    <div 
                      key={sess.sessionId}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900">{sess.sessionName}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{sess.date} • {formatTimeRange(sess.startTime, sess.endTime)}</p>
                      </div>

                      <div>
                        {record ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-slate-700">{presentCount}/4 Present</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              presentCount === 4 ? 'bg-emerald-100 text-emerald-800' :
                              presentCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {presentCount === 4 ? 'Complete' : 'Partial'}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                            Unrecorded
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};

