import React, { useState, useEffect } from 'react';
import type { Team, Session, AttendanceStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Save, AlertCircle } from 'lucide-react';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  activeSession: Session | null;
  onSave: (memberStatus: { name: string; regNo: string; status: AttendanceStatus }[]) => void;
  isDuplicate?: boolean;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  team,
  activeSession,
  onSave,
  isDuplicate = false
}) => {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (team) {
      const initial: Record<string, AttendanceStatus> = {};
      team.members.forEach(m => {
        initial[m.regNo] = 'present';
      });
      setStatuses(initial);
    }
  }, [team]);

  if (!team || !activeSession) return null;

  const toggleStatus = (regNo: string) => {
    setStatuses(prev => ({
      ...prev,
      [regNo]: prev[regNo] === 'present' ? 'absent' : 'present'
    }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    team.members.forEach(m => {
      updated[m.regNo] = status;
    });
    setStatuses(updated);
  };

  const handleSave = () => {
    const memberArray = team.members.map(m => ({
      name: m.name,
      regNo: m.regNo,
      status: statuses[m.regNo] || 'absent'
    }));
    onSave(memberArray);
  };

  const presentCount = Object.values(statuses).filter(s => s === 'present').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WEB X ATTENDANCE RECORDING" maxWidth="md">
      <div className="space-y-6">
        
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-md">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-red-600 font-extrabold text-xs">
                {team.teamNumber}
              </span>
              <h4 className="text-xl font-black text-white">{team.teamName}</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Team Lead: <strong>{team.teamLeadName}</strong> ({team.teamLeadRegNo})
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 block">ACTIVE SESSION</span>
            <span className="text-xs font-bold text-slate-200">{activeSession.sessionName}</span>
          </div>
        </div>

        {isDuplicate && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Attendance has already been recorded for this team & session. Submitting again will update the record.</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600">
            Review 4 Members (<strong className="text-emerald-600">{presentCount} Present</strong>, <strong className="text-red-600">{4 - presentCount} Absent</strong>)
          </span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => setAllStatus('present')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => setAllStatus('absent')}
              className="px-2.5 py-1 bg-red-50 text-red-700 font-bold border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {team.members.map((member) => {
            const isPresent = statuses[member.regNo] === 'present';
            return (
              <div
                key={member.regNo}
                onClick={() => toggleStatus(member.regNo)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isPresent 
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-sm' 
                    : 'bg-red-50/70 border-red-300 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                    isPresent ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {isPresent ? '✓' : '✕'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900">{member.name}</span>
                      {member.role === 'Team Lead' && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 rounded-full">
                          Lead
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">{member.regNo}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleStatus(member.regNo); }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-red-600 text-white shadow-md shadow-red-500/20'
                    }`}
                  >
                    {isPresent ? 'Present' : 'Absent'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 text-base"
        >
          <Save className="w-5 h-5" />
          <span>SAVE ATTENDANCE</span>
        </button>

      </div>
    </Modal>
  );
};
