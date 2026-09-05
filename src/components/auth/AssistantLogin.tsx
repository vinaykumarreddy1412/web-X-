import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/RouterContext';
import { GlassCard } from '../common/GlassCard';
import { KeyRound, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

export const AssistantLogin: React.FC = () => {
  const { loginAsAssistant } = useAuth();
  const { navigate } = useNavigation();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successSession, setSuccessSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessSession(null);

    const cleanInput = passcode.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter an Assistant Access Key.');
      return;
    }

    setLoading(true);

    const res = await loginAsAssistant(cleanInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid Assistant Access Key');
      setLoading(false);
    } else if (res.session) {
      setSuccessSession(res.session.sessionName);
      // Brief smooth transition
      setTimeout(() => {
        setLoading(false);
      }, 500);
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

      <GlassCard glowAccent="blue" className="w-full shadow-2xl border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            WEBX ASSISTANT PORTAL
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Enter the session access key provided by the Admin
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successSession && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-extrabold text-emerald-900">Access Granted</p>
              <p className="text-[11px] font-semibold text-emerald-700">Session: {successSession}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter Assistant Access Key
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. WEBXDAY1"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                required
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-wider"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Key...' : 'Continue'}</span>
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
