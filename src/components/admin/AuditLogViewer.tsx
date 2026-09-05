import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { GlassCard } from '../common/GlassCard';
import { Shield } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useAttendance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">SYSTEM AUDIT LOGS</h2>
          <p className="text-xs font-semibold text-slate-500">Security audit trail of attendance changes & admin actions.</p>
        </div>
      </div>

      <GlassCard glowAccent="purple" className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {auditLogs.length === 0 ? (
            <p className="p-8 text-center text-xs font-semibold text-slate-400 italic">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    log.role === 'admin' ? 'bg-indigo-50 text-indigo-600' :
                    log.role === 'assistant' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-900">{log.action}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{log.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block">{log.userId}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{formatDateTime(log.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
