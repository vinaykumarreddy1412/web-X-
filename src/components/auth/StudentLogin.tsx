import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../common/GlassCard';
import { Lock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const { loginWithGoogleStudent } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogleStudent();
    if (!res.success) {
      setErrorMsg(res.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Official WEB X Logo */}
      <div className="flex justify-center mb-6 select-none">
        <img 
          src="/web-x-logo.jpeg" 
          alt="WEB X - Into the Web of Innovation" 
          className="h-20 sm:h-24 w-auto max-w-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      <GlassCard glowAccent="blue" className="w-full shadow-2xl border-slate-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">STUDENT ATTENDANCE PORTAL</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Official university Google authentication for hackathon participants
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Domain restriction callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-blue-50 border border-indigo-100 space-y-2 text-xs text-slate-700 mb-6">
          <div className="flex items-center space-x-2 font-black text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Domain Restriction Active</span>
          </div>
          <p className="font-semibold text-slate-600 text-[11px] leading-relaxed">
            Please sign in using your official <span className="font-extrabold text-red-600">@klu.ac.in</span> Google account.
          </p>
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-700 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant team & QR roster matching by registration ID</span>
          </div>
        </div>

        {/* Google 1-Click Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all flex items-center justify-center space-x-3 text-sm group disabled:opacity-50"
        >
          {/* Google G Logo */}
          <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>{loading ? 'Authenticating Google Account...' : 'Sign In With KLU Google Account'}</span>
        </button>
      </GlassCard>
    </div>
  );
};

