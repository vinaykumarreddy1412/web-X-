import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/RouterContext';
import { GlassCard } from '../common/GlassCard';
import { Shield, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAsAdmin } = useAuth();
  const { navigate } = useNavigation();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await loginAsAdmin(passcode || 'Vinay@83');
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid Admin Password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Official WEB X Logo */}
      <div className="flex justify-center mb-6 select-none cursor-pointer" onClick={() => navigate('/')}>
        <img 
          src="/web-x-logo.jpeg" 
          alt="WEB X - Into the Web of Innovation" 
          className="h-20 sm:h-24 w-auto max-w-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      <GlassCard glowAccent="purple" className="w-full shadow-2xl border-slate-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ADMIN COMMAND PORTAL</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Session configuration, attendance oversight, and roster management
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Master Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter Admin Password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Admin Access...' : 'Access Admin Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Portal</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
