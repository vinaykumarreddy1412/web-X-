import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { fetchTeamByQRToken, fetchTeamByLeadRegNo, fetchTeamByNumber } from '../../services/firebaseService';
import { parseQRTokenPayload } from '../../utils/qrGenerator';
import { formatTimeRange } from '../../utils/timeFormatter';
import { QRScannerModal } from './QRScannerModal';
import { ManualSearch } from './ManualSearch';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import { SuccessVibrationModal } from './SuccessVibrationModal';
import { GlassCard } from '../common/GlassCard';
import type { Team, AttendanceStatus } from '../../types';
import { QrCode, Search, Radio, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export const AssistantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { sessions, markTeamAttendance, attendanceRecords } = useAttendance();

  // Strict session resolution from authenticated assistant user
  const assignedSession = sessions.find(s => s.sessionId === user?.assignedSessionId) || null;
  const isSessionActive = assignedSession && assignedSession.status === 'active';
  const isKeyValid = assignedSession && (assignedSession.assistantKey || '').trim().toUpperCase() === (user?.assistantKey || '').trim().toUpperCase();
  const isAuthorized = isSessionActive && isKeyValid;

  const [scannerOpen, setScannerOpen] = useState(false);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchedTeamNum, setSearchedTeamNum] = useState<string>('');
  const [lastPresentCount, setLastPresentCount] = useState<number>(4);

  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScanSuccess = async (scannedPayload: string) => {
    if (!isAuthorized || !assignedSession) {
      setErrorToast('Cannot scan: This session is closed or access has been revoked.');
      return;
    }

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
    if (!isAuthorized || !assignedSession) {
      setErrorToast('Cannot search: This session is closed or access has been revoked.');
      return;
    }

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
    if (!selectedTeam || !assignedSession || !isAuthorized) {
      setErrorToast('Attendance recording failed: session is closed or unauthorized.');
      return;
    }

    const res = await markTeamAttendance(
      assignedSession.sessionId,
      selectedTeam.teamNumber,
      membersStatus,
      `Assistant (${assignedSession.sessionName})`
    );

    if (!res.success) {
      setErrorToast(res.message || 'Failed to record attendance.');
      setMarkModalOpen(false);
      return;
    }

    const pCount = membersStatus.filter(m => m.status === 'present').length;
    setLastPresentCount(pCount);
    setSearchedTeamNum(selectedTeam.teamNumber);

    setMarkModalOpen(false);
    setSuccessModalOpen(true);
  };

  const activeRecordsForSession = assignedSession 
    ? attendanceRecords.filter(r => r.sessionId === assignedSession.sessionId)
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Session Info Bar */}
      <GlassCard glowAccent="blue" className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border-blue-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">ATTENDANCE ASSISTANT CONSOLE</p>
              {assignedSession ? (
                <h2 className="text-xl font-black text-white">{assignedSession.sessionName}</h2>
              ) : (
                <h2 className="text-xl font-black text-amber-400">No Assigned Session</h2>
              )}
              {assignedSession && (
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {assignedSession.date} • {formatTimeRange(assignedSession.startTime, assignedSession.endTime)}
                </p>
              )}
            </div>
          </div>

          <div>
            {isAuthorized ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Session Active</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-extrabold flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Session Closed / Key Revoked</span>
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Access Revoked / Session Closed Alert */}
      {!isAuthorized && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center space-x-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-extrabold text-sm text-amber-900">This Attendance Session is Closed or Access has been Revoked</p>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              Please contact the Admin to reopen this session or provide a new Assistant Access Key.
            </p>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-red-500 hover:text-red-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <GlassCard glowAccent="red" className={`flex flex-col items-center text-center p-8 ${!isAuthorized ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4 shadow-md">
            <QrCode className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-black text-slate-900">OPTION 1 — SCAN QR</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1 mb-6">
            Use phone camera to instantly scan the team's QR code.
          </p>

          <button
            disabled={!isAuthorized}
            onClick={() => {
              if (!isAuthorized) {
                alert('This session is closed or access is revoked.');
                return;
              }
              setScannerOpen(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-2xl shadow-xl shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <QrCode className="w-5 h-5" />
            <span>OPEN CAMERA SCANNER</span>
          </button>
        </GlassCard>

        <GlassCard glowAccent="blue" className={`flex flex-col justify-between p-8 ${!isAuthorized ? 'opacity-60 pointer-events-none' : ''}`}>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900">OPTION 2 — MANUAL ENTRY</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 mb-4">
              Enter Team Lead Registration Number (e.g. 22CSE1001) or Team ID.
            </p>
          </div>

          <ManualSearch onSearch={handleManualSearch} loading={loading} />
        </GlassCard>

      </div>

      {assignedSession && (
        <GlassCard glowAccent="cyan">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">RECORDED TEAMS ({assignedSession.sessionName})</h3>
            </div>
            <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {activeRecordsForSession.length} Teams Recorded
            </span>
          </div>

          {activeRecordsForSession.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic text-center py-4">
              No teams scanned yet for this session.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeRecordsForSession.map(r => {
                const presentCount = r.members.filter(m => m.status === 'present').length;
                return (
                  <div key={r.teamNumber} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs font-black text-slate-900 block">{r.teamNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{presentCount}/4 Present</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {assignedSession && (
        <MarkAttendanceModal
          isOpen={markModalOpen}
          onClose={() => setMarkModalOpen(false)}
          team={selectedTeam}
          activeSession={assignedSession}
          onSave={handleSaveAttendance}
        />
      )}

      <SuccessVibrationModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        teamNumber={searchedTeamNum}
        presentCount={lastPresentCount}
      />

    </div>
  );
};
