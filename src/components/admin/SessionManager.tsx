import React, { useState } from 'react';
import type { Session, SessionStatus } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { exportSessionAttendanceToExcel } from '../../services/exportService';
import { GlassCard } from '../common/GlassCard';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Play, 
  Square, 
  RefreshCw, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  KeyRound, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ShieldCheck,
  Slash
} from 'lucide-react';

export const SessionManager: React.FC = () => {
  const { 
    sessions, 
    teams, 
    attendanceRecords, 
    createOrUpdateSession, 
    changeSessionKey, 
    revokeSessionKey, 
    setSessionStatus, 
    removeSession 
  } = useAttendance();

  // Create / Edit Session Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteTargetSession, setDeleteTargetSession] = useState<Session | null>(null);

  // Form states
  const [sessionName, setSessionName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [status, setStatus] = useState<SessionStatus>('active');
  const [assistantKey, setAssistantKey] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Change Key Modal states
  const [changeKeyModalOpen, setChangeKeyModalOpen] = useState(false);
  const [keyTargetSession, setKeyTargetSession] = useState<Session | null>(null);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [changeKeyError, setChangeKeyError] = useState<string | null>(null);
  const [changeKeyLoading, setChangeKeyLoading] = useState(false);

  // Revoke Key Confirm Dialog
  const [revokeTargetSession, setRevokeTargetSession] = useState<Session | null>(null);

  // Feedback states
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<{ [sessionId: string]: boolean }>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSession(null);
    setSessionName(`WEBX Day ${sessions.length + 1}`);
    setDate(new Date().toISOString().slice(0, 10));
    setStartTime('09:00');
    setEndTime('11:00');
    setStatus('active');
    setAssistantKey(`WEBXDAY${sessions.length + 1}`);
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (sess: Session) => {
    setEditingSession(sess);
    setSessionName(sess.sessionName);
    setDate(sess.date);
    setStartTime(sess.startTime);
    setEndTime(sess.endTime);
    setStatus(sess.status);
    setAssistantKey(sess.assistantKey || '');
    setDescription(sess.description);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanKey = assistantKey.trim().toUpperCase();
    if (!cleanKey) {
      setFormError('Assistant Access Key is required. Please type a key.');
      return;
    }

    const targetSessionId = editingSession ? editingSession.sessionId : `SESSION00${sessions.length + 1}`;

    const newSession: Session = {
      sessionId: targetSessionId,
      sessionName,
      date,
      startTime,
      endTime,
      description,
      status,
      assistantKey: cleanKey,
      createdAt: editingSession ? editingSession.createdAt : new Date().toISOString(),
      createdBy: 'Admin'
    };

    const res = await createOrUpdateSession(newSession);
    if (!res.success) {
      setFormError(res.message || 'Failed to save session. Check for duplicate keys.');
      return;
    }

    setModalOpen(false);
    showNotice(`Session "${sessionName}" saved with Assistant Key: ${cleanKey}`);
  };

  const openChangeKeyModal = (sess: Session) => {
    setKeyTargetSession(sess);
    setNewKeyInput('');
    setChangeKeyError(null);
    setChangeKeyModalOpen(true);
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyTargetSession) return;

    const cleanKey = newKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      setChangeKeyError('Please type a new Assistant Access Key.');
      return;
    }

    setChangeKeyLoading(true);
    setChangeKeyError(null);

    const res = await changeSessionKey(keyTargetSession.sessionId, cleanKey);
    setChangeKeyLoading(false);

    if (!res.success) {
      setChangeKeyError(res.message || 'Failed to update key.');
      return;
    }

    setChangeKeyModalOpen(false);
    showNotice(`Assistant Key for "${keyTargetSession.sessionName}" updated to: ${cleanKey}`);
  };

  const handleRevokeKey = async () => {
    if (!revokeTargetSession) return;
    const res = await revokeSessionKey(revokeTargetSession.sessionId);
    if (res.success) {
      showNotice(`Assistant Key for "${revokeTargetSession.sessionName}" has been revoked.`);
    }
    setRevokeTargetSession(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetSession) {
      await removeSession(deleteTargetSession.sessionId);
      setDeleteTargetSession(null);
      showNotice(`Session "${deleteTargetSession.sessionName}" deleted.`);
    }
  };

  const copyKey = (sess: Session) => {
    if (!sess.assistantKey) return;
    navigator.clipboard.writeText(sess.assistantKey);
    setCopiedSessionId(sess.sessionId);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  const toggleRevealKey = (sessionId: string) => {
    setRevealedKeys(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const showNotice = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ATTENDANCE SESSION MANAGEMENT</h2>
          <p className="text-xs font-semibold text-slate-500">
            Create sessions with manual Assistant Access Keys, manage keys, and export Excel reports.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all self-start hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW SESSION</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm animate-in fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((sess: Session) => {
          const isRevealed = !!revealedKeys[sess.sessionId];
          const isCopied = copiedSessionId === sess.sessionId;

          return (
            <GlassCard 
              key={sess.sessionId} 
              glowAccent={sess.status === 'active' ? 'blue' : sess.status === 'closed' ? 'none' : 'purple'}
              className={sess.status === 'active' ? 'border-2 border-emerald-400 bg-emerald-50/20' : ''}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">{sess.sessionId}</span>
                  <h3 className="text-lg font-black text-slate-900">{sess.sessionName}</h3>
                </div>

                <div>
                  {sess.status === 'active' && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>ACTIVE</span>
                    </span>
                  )}
                  {sess.status === 'closed' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                      CLOSED
                    </span>
                  )}
                  {sess.status === 'draft' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      DRAFT
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium mb-3 line-clamp-2">{sess.description || 'No description provided.'}</p>

              {/* Date & Time */}
              <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 border-t border-slate-100 pt-3 mb-3">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sess.date}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sess.startTime} - {sess.endTime}</span>
                </span>
              </div>

              {/* ASSISTANT KEY PANEL (View Key, Copy Key, Change Key, Revoke Key) */}
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 mb-4 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                      ASSISTANT ACCESS KEY
                    </span>
                  </div>
                  {sess.status !== 'active' && sess.assistantKey && (
                    <span className="text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      Session Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-black tracking-wider text-amber-400">
                      {sess.assistantKey ? (
                        isRevealed ? sess.assistantKey : '••••••••••••'
                      ) : (
                        <span className="text-red-400 text-xs italic">No Key Assigned (Revoked)</span>
                      )}
                    </span>
                    {sess.assistantKey && (
                      <button
                        type="button"
                        onClick={() => toggleRevealKey(sess.sessionId)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title={isRevealed ? "Hide Key" : "View Key"}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Copy Key Button */}
                  {sess.assistantKey && (
                    <button
                      type="button"
                      onClick={() => copyKey(sess)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                        isCopied 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {/* Key Management Actions: Change Key & Revoke Key */}
                <div className="flex items-center justify-end space-x-2 mt-2.5 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => openChangeKeyModal(sess)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-[11px] font-extrabold border border-blue-500/30 transition-all flex items-center space-x-1"
                  >
                    <KeyRound className="w-3 h-3 text-blue-400" />
                    <span>Change Key</span>
                  </button>

                  {sess.assistantKey && (
                    <button
                      type="button"
                      onClick={() => setRevokeTargetSession(sess)}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 text-[11px] font-extrabold border border-red-500/30 transition-all flex items-center space-x-1"
                    >
                      <Slash className="w-3 h-3 text-red-400" />
                      <span>Revoke Key</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Session Status & Admin Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center space-x-2">
                  {sess.status !== 'active' ? (
                    <button
                      onClick={() => setSessionStatus(sess.sessionId, 'active')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>OPEN SESSION</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSessionStatus(sess.sessionId, 'closed')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>CLOSE SESSION</span>
                    </button>
                  )}

                  {sess.status === 'closed' && (
                    <button
                      onClick={() => setSessionStatus(sess.sessionId, 'active')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>REOPEN</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* 1-Click Session Team-Wise Excel Export */}
                  <button
                    onClick={() => exportSessionAttendanceToExcel(sess, teams, attendanceRecords)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1.5 transition-colors"
                    title={`Export ${sess.sessionName} Team-Wise Excel (.xlsx)`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>EXPORT EXCEL</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(sess)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Session Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteTargetSession(sess)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingSession ? 'EDIT ATTENDANCE SESSION' : 'CREATE NEW ATTENDANCE SESSION'} 
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Name</label>
            <input
              type="text"
              required
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. WEBX Day 1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SessionStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="active">Active (Open for Attendance)</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Assistant Access Key Input (Mandatory, Manually Typed) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5">
            <label className="block text-xs font-black text-amber-900 uppercase flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Assistant Access Key (Manually Entered)</span>
            </label>
            <input
              type="text"
              required
              value={assistantKey}
              onChange={(e) => setAssistantKey(e.target.value.toUpperCase())}
              placeholder="e.g. WEBXDAY1"
              className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-amber-800 font-semibold">
              Admin manually decides this key. Assistants must enter this exact key at <code className="font-mono text-amber-900">/assistant</code> to take attendance for this session.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of attendance session..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md text-xs transition-all"
          >
            {editingSession ? 'UPDATE SESSION' : 'CREATE SESSION'}
          </button>
        </form>
      </Modal>

      {/* Change Key Modal */}
      <Modal
        isOpen={changeKeyModalOpen}
        onClose={() => setChangeKeyModalOpen(false)}
        title="CHANGE ASSISTANT KEY"
        maxWidth="sm"
      >
        {keyTargetSession && (
          <form onSubmit={handleUpdateKey} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-500">Session</p>
              <p className="text-sm font-extrabold text-slate-900">{keyTargetSession.sessionName}</p>
              <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                Current Key: <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{keyTargetSession.assistantKey || 'None'}</span>
              </p>
            </div>

            {changeKeyError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{changeKeyError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                New Assistant Key
              </label>
              <input
                type="text"
                required
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value.toUpperCase())}
                placeholder="e.g. WEBXDAY1-NEW"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                The previous key will immediately become invalid.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setChangeKeyModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changeKeyLoading || !newKeyInput.trim()}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {changeKeyLoading ? 'Updating...' : 'Update Key'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Revoke Key Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!revokeTargetSession}
        onClose={() => setRevokeTargetSession(null)}
        onConfirm={handleRevokeKey}
        title="REVOKE ASSISTANT KEY"
        message={`Are you sure you want to revoke the Assistant Access Key for "${revokeTargetSession?.sessionName}"? Assistant portal access using this key will immediately stop working.`}
      />

      {/* Delete Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetSession}
        onClose={() => setDeleteTargetSession(null)}
        onConfirm={handleDeleteConfirm}
        title="DELETE SESSION"
        message={`Are you sure you want to delete session "${deleteTargetSession?.sessionName}" (${deleteTargetSession?.sessionId})? This action cannot be undone.`}
      />
    </div>
  );
};

