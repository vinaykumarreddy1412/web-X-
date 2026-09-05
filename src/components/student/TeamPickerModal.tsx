import React, { useState, useMemo } from 'react';
import type { Team } from '../../types';
import { Search, Users, X, Check, ArrowRight } from 'lucide-react';

interface TeamPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  selectedTeamNumber: string;
  onSelectTeam: (team: Team) => void;
}

export const TeamPickerModal: React.FC<TeamPickerModalProps> = ({
  isOpen,
  onClose,
  teams,
  selectedTeamNumber,
  onSelectTeam
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter(t => {
      const matchNum = t.teamNumber?.toLowerCase().includes(q);
      const matchName = t.teamName?.toLowerCase().includes(q);
      const matchLeadReg = t.teamLeadRegNo?.toLowerCase().includes(q);
      const matchLeadName = t.teamLeadName?.toLowerCase().includes(q);
      const matchMember = t.members?.some(m => 
        m.name?.toLowerCase().includes(q) || m.regNo?.toLowerCase().includes(q)
      );
      return matchNum || matchName || matchLeadReg || matchLeadName || matchMember;
    });
  }, [teams, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">SELECT YOUR TEAM</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Search by Reg No, Team Number or Student Name
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. 2200031001, TEAM-05, or Lead Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Teams List */}
        <div className="max-h-[360px] overflow-y-auto p-4 space-y-2">
          {filteredTeams.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold text-xs">
              No team found matching "{searchQuery}".
            </div>
          ) : (
            filteredTeams.map((t) => {
              const isSelected = t.teamNumber === selectedTeamNumber;
              return (
                <div
                  key={t.teamNumber}
                  onClick={() => {
                    onSelectTeam(t);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-50/80 border-red-500 shadow-sm text-red-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[10px] uppercase">
                        {t.teamNumber}
                      </span>
                      <span className="text-sm font-black text-slate-900">{t.teamName}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      Lead: <strong className="text-slate-700">{t.teamLeadName}</strong> ({t.teamLeadRegNo})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isSelected ? (
                      <span className="p-1 rounded-full bg-red-600 text-white">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-slate-700">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{teams.length} Total Teams Registered</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
