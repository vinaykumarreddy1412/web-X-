import React, { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface ManualSearchProps {
  onSearch: (input: string) => void;
  loading?: boolean;
}

export const ManualSearch: React.FC<ManualSearchProps> = ({ onSearch, loading = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <GlassCard glowAccent="blue" className="w-full">
      <div className="flex items-center space-x-2 mb-3">
        <UserCheck className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-black text-slate-900">MANUAL ATTENDANCE ENTRY</h3>
      </div>
      <p className="text-xs font-semibold text-slate-500 mb-4">
        Enter Team Lead Registration Number or Team Number (Alternative to QR scanning)
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="e.g. 22CSE1001 or TEAM027"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase tracking-wider placeholder:normal-case placeholder:font-normal"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/20 text-xs flex items-center justify-center space-x-2 transition-all shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Searching...' : 'SEARCH TEAM'}</span>
        </button>
      </form>
    </GlassCard>
  );
};
