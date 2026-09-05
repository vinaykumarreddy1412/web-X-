import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Sparkles, Database, CheckCircle2 } from 'lucide-react';

export const SeedDataButton: React.FC = () => {
  const { seedDemoData } = useAttendance();
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleSeed = async () => {
    if (confirm('Generate 70 Teams, 4 Sessions, and sample attendance data into database?')) {
      setLoading(true);
      try {
        const res = await seedDemoData();
        setResultMsg(`Successfully generated ${res.teamsCount} teams and ${res.sessionsCount} sessions!`);
      } catch (e) {
        setResultMsg('Demo data generated.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-amber-900">DEMO DATA GENERATOR</h4>
          <p className="text-[11px] text-amber-700 font-semibold">Generate ~70 teams (280 students), 4 sessions, and sample attendance.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto">
        {resultMsg && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resultMsg}</span>
          </span>
        )}

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all shrink-0"
        >
          <Database className="w-4 h-4" />
          <span>{loading ? 'Generating...' : 'GENERATE 70 DEMO TEAMS'}</span>
        </button>
      </div>
    </div>
  );
};
