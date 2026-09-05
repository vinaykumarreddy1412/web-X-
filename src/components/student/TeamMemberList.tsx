import React from 'react';
import type { TeamMember, AttendanceMember } from '../../types';
import { ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface TeamMemberListProps {
  teamNumber: string;
  members: TeamMember[];
  attendanceMembers?: AttendanceMember[];
  activeSessionName?: string;
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  teamNumber,
  members,
  attendanceMembers,
  activeSessionName
}) => {
  const getMemberStatus = (regNo: string) => {
    if (!attendanceMembers) return 'not_marked';
    const found = attendanceMembers.find(m => m.regNo === regNo);
    return found ? found.status : 'not_marked';
  };

  return (
    <GlassCard glowAccent="blue" className="w-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">TEAM MEMBERS</h3>
          <p className="text-xs font-semibold text-slate-500">{teamNumber} • 4 Members Enrolled</p>
        </div>
        {activeSessionName && (
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            {activeSessionName}
          </span>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Registration No.</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Session Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => {
              const status = getMemberStatus(member.regNo);
              return (
                <tr key={member.regNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-extrabold text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <span>{member.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-600">
                    {member.regNo}
                  </td>
                  <td className="py-3.5 px-4">
                    {member.role === 'Team Lead' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Team Lead</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {status === 'present' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </span>
                    )}
                    {status === 'absent' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </span>
                    )}
                    {status === 'not_marked' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Not Marked</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {members.map((member) => {
          const status = getMemberStatus(member.regNo);
          return (
            <div key={member.regNo} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">{member.name}</span>
                  {member.role === 'Team Lead' && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">Lead</span>
                  )}
                </div>
                <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{member.regNo}</p>
              </div>

              <div>
                {status === 'present' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    Present
                  </span>
                )}
                {status === 'absent' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800">
                    Absent
                  </span>
                )}
                {status === 'not_marked' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
