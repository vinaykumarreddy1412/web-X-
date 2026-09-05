import React, { useState } from 'react';
import type { Team, TeamMember } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { generateSecureQRToken } from '../../utils/qrGenerator';
import { GlassCard } from '../common/GlassCard';
import { Modal } from '../common/Modal';
import { CSVImportModal } from './CSVImportModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Search, Plus, QrCode, RefreshCw, Edit, Trash2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const TeamManager: React.FC = () => {
  const { teams, createOrUpdateTeam, removeTeam, importTeamsFromCSV } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [qrModalTeam, setQrModalTeam] = useState<Team | null>(null);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteTargetNum, setDeleteTargetNum] = useState<string | null>(null);

  const [teamNumber, setTeamNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([
    { name: '', regNo: '', role: 'Team Lead' },
    { name: '', regNo: '', role: 'Member' },
    { name: '', regNo: '', role: 'Member' },
    { name: '', regNo: '', role: 'Member' }
  ]);

  const filteredTeams = teams.filter(t => 
    t.teamNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teamLeadRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teamLeadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.regNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingTeam(null);
    const nextNum = `TEAM${(teams.length + 1).toString().padStart(3, '0')}`;
    setTeamNumber(nextNum);
    setTeamName('');
    setMembers([
      { name: '', regNo: '', role: 'Team Lead' },
      { name: '', regNo: '', role: 'Member' },
      { name: '', regNo: '', role: 'Member' },
      { name: '', regNo: '', role: 'Member' }
    ]);
    setTeamModalOpen(true);
  };

  const openEditModal = (t: Team) => {
    setEditingTeam(t);
    setTeamNumber(t.teamNumber);
    setTeamName(t.teamName);
    
    const mems = [...t.members];
    while (mems.length < 4) {
      mems.push({ name: '', regNo: '', role: 'Member' });
    }
    setMembers(mems);
    setTeamModalOpen(true);
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, val: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: val };
    setMembers(updated);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const lead = members.find(m => m.role === 'Team Lead') || members[0];
    const validMembers = members.filter(m => m.regNo.trim() !== '');

    const teamToSave: Team = {
      teamNumber: teamNumber.trim().toUpperCase(),
      teamName: teamName.trim() || `Team ${teamNumber}`,
      teamLeadRegNo: lead.regNo.trim().toUpperCase(),
      teamLeadName: lead.name.trim() || 'Team Lead',
      qrToken: editingTeam ? editingTeam.qrToken : generateSecureQRToken(teamNumber),
      createdAt: editingTeam ? editingTeam.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: validMembers
    };

    await createOrUpdateTeam(teamToSave);
    setTeamModalOpen(false);
  };

  const handleRegenerateQR = async (t: Team) => {
    const updated: Team = {
      ...t,
      qrToken: generateSecureQRToken(t.teamNumber),
      updatedAt: new Date().toISOString()
    };
    await createOrUpdateTeam(updated);
    if (qrModalTeam?.teamNumber === t.teamNumber) {
      setQrModalTeam(updated);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">HACKATHON TEAM MANAGEMENT</h2>
          <p className="text-xs font-semibold text-slate-500">Manage {teams.length} registered teams & 4-member rosters.</p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>IMPORT EXCEL / CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ADD TEAM</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search by team number, team name, lead name, student name, or reg number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((t) => (
          <GlassCard key={t.teamNumber} glowAccent="blue" className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold text-xs uppercase">
                    {t.teamNumber}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{t.teamName}</h3>
                </div>

                <button
                  onClick={() => setQrModalTeam(t)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                  title="View Team QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                <p className="text-[11px] font-extrabold text-indigo-700 uppercase flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Team Lead: {t.teamLeadName}</span>
                </p>
                <p className="text-[10px] font-mono font-bold text-slate-500">Reg: {t.teamLeadRegNo}</p>
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Roster (4 Members)</p>
                {t.members.map((m) => (
                  <div key={m.regNo} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{m.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{m.regNo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <button
                onClick={() => handleRegenerateQR(t)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                title="Regenerate unique QR token"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regen QR Token</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(t)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTargetNum(t.teamNumber)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} title={editingTeam ? `EDIT TEAM ${teamNumber}` : 'ADD NEW TEAM'} maxWidth="lg">
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Team Number</label>
              <input
                type="text"
                required
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                placeholder="e.g. TEAM027"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Innovators"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-slate-800 uppercase">Team Members Roster (4 Members)</p>
            {members.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Member {idx + 1} {idx === 0 ? '(Team Lead)' : ''}</span>
                  <select
                    value={m.role}
                    onChange={(e) => handleMemberChange(idx, 'role', e.target.value as any)}
                    className="text-[10px] font-bold bg-white border border-slate-300 rounded px-2 py-0.5"
                  >
                    <option value="Team Lead">Team Lead</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Student Full Name"
                    required={idx < 2}
                    value={m.name}
                    onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Reg No (e.g. 22CSE1001)"
                    required={idx < 2}
                    value={m.regNo}
                    onChange={(e) => handleMemberChange(idx, 'regNo', e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md"
          >
            {editingTeam ? 'UPDATE TEAM' : 'SAVE TEAM TO FIREBASE'}
          </button>
        </form>
      </Modal>

      {qrModalTeam && (
        <Modal isOpen={!!qrModalTeam} onClose={() => setQrModalTeam(null)} title={`TEAM QR • ${qrModalTeam.teamNumber}`} maxWidth="sm">
          <div className="text-center space-y-4">
            <h4 className="text-lg font-black text-slate-900">{qrModalTeam.teamName}</h4>
            <p className="text-xs text-slate-500 font-bold">Lead: {qrModalTeam.teamLeadName} ({qrModalTeam.teamLeadRegNo})</p>

            <div className="p-4 bg-white border-2 border-red-500/30 rounded-2xl inline-block shadow-lg">
              <QRCodeSVG value={qrModalTeam.qrToken} size={200} />
            </div>

            <p className="text-[10px] font-mono text-slate-400 font-extrabold">Token: {qrModalTeam.qrToken}</p>

            <button
              onClick={() => handleRegenerateQR(qrModalTeam)}
              className="w-full py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate QR Token</span>
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteTargetNum}
        onClose={() => setDeleteTargetNum(null)}
        onConfirm={() => deleteTargetNum && removeTeam(deleteTargetNum)}
        title="DELETE TEAM"
        message={`Are you sure you want to delete ${deleteTargetNum}? This action will permanently remove the team and its roster.`}
      />

      <CSVImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImport={importTeamsFromCSV}
      />

    </div>
  );
};
