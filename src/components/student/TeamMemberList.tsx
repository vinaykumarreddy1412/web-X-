import React from 'react';
import type { TeamMember } from '../../types';
import { ShieldCheck, User } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface TeamMemberListProps {
  teamNumber: string;
  members: TeamMember[];
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  teamNumber,
  members
}) => {
  return (
    <GlassCard glowAccent="blue" className="w-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">TEAM MEMBERS</h3>
          <p className="text-xs font-semibold text-slate-500">{teamNumber} • {members.length} Members Enrolled</p>
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Registration No.</th>
              <th className="py-3 px-4 text-right">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => (
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
                <td className="py-3.5 px-4 text-right">
                  {member.role === 'Team Lead' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Team Lead</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      <User className="w-3 h-3" />
                      <span>Member</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {members.map((member) => (
          <div key={member.regNo} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900">{member.name}</span>
                {member.role === 'Team Lead' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">Lead</span>
                )}
              </div>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{member.regNo}</p>
            </div>

            <div>
              {member.role === 'Team Lead' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Team Lead
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  Member
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
