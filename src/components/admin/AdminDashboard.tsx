import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { fetchTeamByQRToken, fetchTeamByLeadRegNo, fetchTeamByNumber } from '../../services/firebaseService';
import { parseQRTokenPayload } from '../../utils/qrGenerator';
import { StatCard } from '../common/StatCard';
import { GlassCard } from '../common/GlassCard';
import { SessionManager } from './SessionManager';
import { TeamManager } from './TeamManager';
import { AttendanceManager } from './AttendanceManager';
import { ReportsView } from './ReportsView';
import { AuditLogViewer } from './AuditLogViewer';
import { SeedDataButton } from './SeedDataButton';
import { AssistantPasscodeManager } from './AssistantPasscodeManager';
import { QRScannerModal } from '../assistant/QRScannerModal';
import { ManualSearch } from '../assistant/ManualSearch';
import { MarkAttendanceModal } from '../assistant/MarkAttendanceModal';
import { SuccessVibrationModal } from '../assistant/SuccessVibrationModal';
import type { Team, AttendanceStatus } from '../../types';
import { 
  Users, 
  Radio, 
  UserCheck, 
  UserX, 
  Percent, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  FileSpreadsheet, 
  Clock,
  QrCode,
  Search,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab: propTab,
  setActiveTab: setPropTab
}) => {
  const { 
    teams, 
    sessions, 
    activeSession, 
    attendanceRecords,
    auditLogs,
    markTeamAttendance
  } = useAttendance();

  const [localTab, setLocalTab] = useState<'overview' | 'take-attendance' | 'sessions' | 'teams' | 'attendance' | 'reports' | 'audit'>('overview');

  // Scanner & Attendance Modal states for Admin
  const [scannerOpen, setScannerOpen] = useState(false);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchedTeamNum, setSearchedTeamNum] = useState<string>('');
  const [lastPresentCount, setLastPresentCount] = useState<number>(4);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentTab = (propTab && propTab !== 'dashboard' ? propTab : localTab) as any;
  const handleTabChange = (t: string) => {
    setLocalTab(t as any);
    if (setPropTab) setPropTab(t);
  };

  const handleScanSuccess = async (scannedPayload: string) => {
    setScannerOpen(false);
    setErrorToast(null);
    setLoading(true);

    const parsed = parseQRTokenPayload(scannedPayload);
    let team: Team | null = null;

    if (parsed.isValid && parsed.qrToken) {
      team = await fetchTeamByQRToken(parsed.qrToken);
    }

    if (!team && parsed.teamNumber) {
      team = await fetchTeamByNumber(parsed.teamNumber);
    }

    if (!team) {
      team = await fetchTeamByQRToken(scannedPayload);
    }

    if (!team) {
      setErrorToast('Invalid Web X Team QR code or Team not found.');
      setLoading(false);
      return;
    }

    setSelectedTeam(team);
    setMarkModalOpen(true);
    setLoading(false);
  };

  const handleManualSearch = async (query: string) => {
    setErrorToast(null);
    setLoading(true);
    let team: Team | null = null;

    team = await fetchTeamByLeadRegNo(query);

    if (!team) {
      team = await fetchTeamByNumber(query);
    }

    if (!team) {
      setErrorToast(`No team found matching "${query}". Please verify registration number or team ID.`);
      setLoading(false);
      return;
    }

    setSelectedTeam(team);
    setMarkModalOpen(true);
    setLoading(false);
  };

  const handleSaveAttendance = async (membersStatus: { name: string; regNo: string; status: AttendanceStatus }[]) => {
    if (!selectedTeam || !activeSession) return;

    await markTeamAttendance(
      activeSession.sessionId,
      selectedTeam.teamNumber,
      membersStatus,
      'Admin'
    );

    const pCount = membersStatus.filter(m => m.status === 'present').length;
    setLastPresentCount(pCount);
    setSearchedTeamNum(selectedTeam.teamNumber);

    setMarkModalOpen(false);
    setSuccessModalOpen(true);
  };

  const totalTeams = teams.length;
  const totalStudents = totalTeams * 4;

  const activeRecords = activeSession
    ? attendanceRecords.filter(r => r.sessionId === activeSession.sessionId)
    : [];

  let presentCount = 0;
  let absentCount = 0;

  activeRecords.forEach(rec => {
    rec.members.forEach(m => {
      if (m.status === 'present') presentCount++;
      else absentCount++;
    });
  });

  const unrecordedStudents = Math.max(0, (totalTeams - activeRecords.length) * 4);
  absentCount += unrecordedStudents;

  const attendancePercentage = totalStudents > 0
    ? `${((presentCount / totalStudents) * 100).toFixed(0)}%`
    : '0%';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Error Toast */}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between shadow-sm animate-bounce">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-red-500 hover:text-red-800 font-extrabold text-sm ml-4">✕</button>
        </div>
      )}

      {/* Admin Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center space-x-1 overflow-x-auto p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'overview' || currentTab === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* Dedicated Take Attendance Tab for Admin */}
          <button
            onClick={() => handleTabChange('take-attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'take-attendance'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-red-500" />
            <span>Take Attendance</span>
          </button>

          <button
            onClick={() => handleTabChange('sessions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'sessions'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('teams')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'teams'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams ({teams.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'attendance'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Attendance Audit</span>
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'reports'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Reports</span>
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              currentTab === 'audit'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        <SeedDataButton />
      </div>

      {(currentTab === 'overview' || currentTab === 'dashboard') && (
        <div className="space-y-6">
          
          {/* Admin Attendance Quick Action Bar */}
          {activeSession ? (
            <GlassCard glowAccent="cyan" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
                      LIVE SESSION ATTENDANCE
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">{activeSession.sessionName}</h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {activeSession.sessionId} • {activeSession.date} • {activeSession.startTime} - {activeSession.endTime}
                  </p>
                </div>

                <div className="flex items-center space-x-3 self-start md:self-auto">
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/25 flex items-center space-x-2 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>SCAN TEAM QR</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('take-attendance')}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/20 flex items-center space-x-2 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span>MANUAL SEARCH</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800">No session is currently open. Open a session in the Sessions tab to record attendance.</span>
              </div>
              <button
                onClick={() => handleTabChange('sessions')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
              >
                Go to Sessions
              </button>
            </div>
          )}

          {/* Key Metrics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Teams"
              value={totalTeams}
              subtitle="Registered teams"
              icon={Layers}
              color="indigo"
            />
            <StatCard
              title="Total Students"
              value={totalStudents}
              subtitle="4 members / team"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Active Session"
              value={activeSession ? activeSession.sessionName : 'No Session Open'}
              badge={activeSession ? activeSession.sessionId : undefined}
              subtitle={activeSession ? `${activeSession.startTime} - ${activeSession.endTime}` : 'All sessions closed'}
              icon={Radio}
              color={activeSession ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Present"
              value={presentCount}
              subtitle="Students verified"
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              title="Absent"
              value={absentCount}
              subtitle="Students missing"
              icon={UserX}
              color="red"
            />
            <StatCard
              title="Attendance %"
              value={attendancePercentage}
              subtitle="Live active session rate"
              icon={Percent}
              color="indigo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SessionManager />
            <TeamManager />
          </div>

          <AssistantPasscodeManager />
        </div>
      )}

      {/* Admin Take Attendance Section */}
      {currentTab === 'take-attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">ADMIN ATTENDANCE SCANNER</h2>
              <p className="text-xs font-semibold text-slate-500">Scan QR codes with device camera or search teams by registration number.</p>
            </div>

            {activeSession && (
              <button
                onClick={() => setScannerOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/25 flex items-center space-x-2 transition-all self-start"
              >
                <QrCode className="w-4 h-4" />
                <span>OPEN CAMERA QR SCANNER</span>
              </button>
            )}
          </div>

          {activeSession ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-6">
                <GlassCard glowAccent="red" className="text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Camera QR Scanner</h3>
                  <p className="text-xs text-slate-500 font-medium">Point your camera at the student's team QR code to automatically load their roster.</p>
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md"
                  >
                    START CAMERA SCAN
                  </button>
                </GlassCard>

                <ManualSearch onSearch={handleManualSearch} loading={loading} />
              </div>

              <div className="md:col-span-7">
                <GlassCard glowAccent="blue" className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">RECENTLY RECORDED TEAMS</h3>
                      <p className="text-xs text-slate-500 font-semibold">{activeSession.sessionName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeRecords.length} / {teams.length} Teams
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto text-xs">
                    {activeRecords.length === 0 ? (
                      <p className="p-8 text-center text-slate-400 font-semibold italic">No teams marked yet for this session.</p>
                    ) : (
                      activeRecords.map(rec => {
                        const pCount = rec.members.filter(m => m.status === 'present').length;
                        return (
                          <div key={rec.id || rec.teamNumber} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <span className="font-extrabold text-slate-900">{rec.teamNumber}</span>
                              <p className="text-[10px] text-slate-500 font-medium">Marked by {rec.markedBy} at {new Date(rec.markedAt).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-700">{pCount}/4 Present</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                pCount === 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {pCount === 4 ? 'Complete' : 'Partial'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : (
            <GlassCard glowAccent="blue" className="p-8 text-center space-y-4">
              <Radio className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-slate-900">No Active Attendance Session</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Please open a hackathon session first before taking attendance.
              </p>
              <button
                onClick={() => handleTabChange('sessions')}
                className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Go to Session Manager
              </button>
            </GlassCard>
          )}
        </div>
      )}

      {currentTab === 'sessions' && <SessionManager />}
      {currentTab === 'teams' && <TeamManager />}
      {currentTab === 'attendance' && <AttendanceManager />}
      {currentTab === 'reports' && <ReportsView />}
      {currentTab === 'audit' && <AuditLogViewer />}

      {/* Admin QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Admin 4-Member Attendance Toggle Modal */}
      {selectedTeam && activeSession && (
        <MarkAttendanceModal
          isOpen={markModalOpen}
          onClose={() => setMarkModalOpen(false)}
          team={selectedTeam}
          activeSession={activeSession}
          onSave={handleSaveAttendance}
        />
      )}

      {/* Success Vibration Confirmation Modal */}
      <SuccessVibrationModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        teamNumber={searchedTeamNum}
        presentCount={lastPresentCount}
      />

    </div>
  );
};
