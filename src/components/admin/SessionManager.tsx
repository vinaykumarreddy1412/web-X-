import React, { useState } from 'react';
import type { Session } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { exportSessionAttendanceToExcel } from '../../services/exportService';
import { GlassCard } from '../common/GlassCard';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Calendar, Clock, Plus, Play, Square, RefreshCw, Edit, Trash2, FileSpreadsheet } from 'lucide-react';

export const SessionManager: React.FC = () => {
  const { sessions, teams, attendanceRecords, createOrUpdateSession, setSessionStatus, removeSession } = useAttendance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteTargetSession, setDeleteTargetSession] = useState<Session | null>(null);

  const [sessionName, setSessionName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingSession(null);
    setSessionName(`Session 0${sessions.length + 1} - Hackathon Round ${sessions.length + 1}`);
    setDate(new Date().toISOString().slice(0, 10));
    setStartTime('10:00');
    setEndTime('12:00');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (sess: Session) => {
    setEditingSession(sess);
    setSessionName(sess.sessionName);
    setDate(sess.date);
    setStartTime(sess.startTime);
    setEndTime(sess.endTime);
    setDescription(sess.description);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: Session = {
      sessionId: editingSession ? editingSession.sessionId : `SESSION00${sessions.length + 1}`,
      sessionName,
      date,
      startTime,
      endTime,
      description,
      status: editingSession ? editingSession.status : 'draft',
      createdAt: editingSession ? editingSession.createdAt : new Date().toISOString(),
      createdBy: 'Admin'
    };

    await createOrUpdateSession(newSession);
    setModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetSession) {
      await removeSession(deleteTargetSession.sessionId);
      setDeleteTargetSession(null);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">ATTENDANCE SESSION MANAGEMENT</h2>
          <p className="text-xs font-semibold text-slate-500">Create, open, close, delete, and export team-wise session attendance to Excel.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW SESSION</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((sess: Session) => (
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
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                    ● ACTIVE
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

            <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2">{sess.description || 'No description provided.'}</p>

            <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 border-t border-slate-100 pt-3 mb-4">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{sess.date}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{sess.startTime} - {sess.endTime}</span>
              </span>
            </div>

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
                  title="Edit Session"
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
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSession ? 'EDIT SESSION' : 'CREATE NEW SESSION'} maxWidth="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Name</label>
            <input
              type="text"
              required
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Session 01 - Opening Ceremony"
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of attendance session..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md text-xs"
          >
            {editingSession ? 'UPDATE SESSION' : 'SAVE SESSION'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
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
