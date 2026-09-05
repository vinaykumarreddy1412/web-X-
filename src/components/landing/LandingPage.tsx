import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../common/GlassCard';
import { Shield, QrCode, UserCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginWithGoogleStudent, loginAsAssistant, loginAsAdmin } = useAuth();
  
  const [activePortal, setActivePortal] = useState<'student' | 'assistant' | 'admin'>('student');
  
  const [assistantKey, setAssistantKey] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogleStudent();
    if (!res.success) {
      setErrorMsg(res.message || 'Google Sign-in failed.');
    }
    setLoading(false);
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await loginAsAssistant(assistantKey || 'webx2026');
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid assistant credentials.');
    }
    setLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await loginAsAdmin(adminKey || 'admin123');
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid admin credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center overflow-x-hidden">
      
      {/* Main Centered Login Portal */}
      <main className="max-w-md mx-auto px-4 py-8 z-10 w-full flex-1 flex flex-col items-center justify-center">
        
        <div className="w-full">
          {/* Official WEB X Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/web-x-logo.jpeg" 
              alt="WEB X - Into the Web of Innovation" 
              className="h-20 sm:h-24 w-auto max-w-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
            />
          </div>

          <GlassCard glowAccent="blue" className="shadow-2xl border-slate-200">
            
            {/* Portal Switch Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setActivePortal('student'); setErrorMsg(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1 ${
                  activePortal === 'student'
                    ? 'bg-white text-red-600 shadow-md border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => { setActivePortal('assistant'); setErrorMsg(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1 ${
                  activePortal === 'assistant'
                    ? 'bg-white text-blue-600 shadow-md border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => { setActivePortal('admin'); setErrorMsg(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1 ${
                  activePortal === 'admin'
                    ? 'bg-white text-indigo-600 shadow-md border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Student Portal: Google Sign-in restricted to @klu.ac.in */}
            {activePortal === 'student' && (
              <div className="space-y-5">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900">KLU Student Portal</h3>
                  <p className="text-xs font-medium text-slate-500">Sign in with your official university email to access team QR & attendance.</p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-blue-50 border border-indigo-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center space-x-2 font-black text-indigo-900">
                    <Lock className="w-4 h-4 text-red-600" />
                    <span>Domain Restriction Active</span>
                  </div>
                  <p className="font-semibold text-slate-600 text-[11px] leading-relaxed">
                    Authentication is strictly limited to official <span className="font-bold text-red-600">@klu.ac.in</span> Google accounts. Personal Gmail accounts are not allowed.
                  </p>
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automatic team & roster matching by registration ID</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStudentGoogleLogin}
                  disabled={loading}
                  className="w-full py-4 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-200/90 shadow-md hover:shadow-lg hover:border-slate-300 transition-all flex items-center justify-center space-x-3 text-sm group active:scale-[0.99]"
                >
                  {/* Google G Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>{loading ? 'Verifying @klu.ac.in Account...' : 'Continue with Google (@klu.ac.in)'}</span>
                </button>
              </div>
            )}

            {activePortal === 'assistant' && (
              <form onSubmit={handleAssistantSubmit} className="space-y-4">
                <div className="text-left mb-2">
                  <h3 className="text-lg font-black text-slate-900">Attendance Assistant Portal</h3>
                  <p className="text-xs font-medium text-slate-500">Scan QR codes or manually verify student rosters.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assistant Passkey
                  </label>
                  <input
                    type="password"
                    placeholder="Enter key (Default: webx2026)"
                    value={assistantKey}
                    onChange={(e) => setAssistantKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-800 font-medium">
                  <p className="font-bold">📱 Camera & Scanner Access Enabled</p>
                  <p className="text-blue-600 mt-0.5">Default passcode: <span className="font-mono font-bold">webx2026</span></p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{loading ? 'Logging In...' : 'Open Assistant Scanner'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {activePortal === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="text-left mb-2">
                  <h3 className="text-lg font-black text-slate-900">Web X Admin Dashboard</h3>
                  <p className="text-xs font-medium text-slate-500">Full system control, session management & export.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admin Security Code
                  </label>
                  <input
                    type="password"
                    placeholder="Enter admin passcode (Default: admin123)"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-[11px] text-indigo-800 font-medium">
                  <p className="font-bold">⚙️ Firebase Firestore Control Center</p>
                  <p className="text-indigo-600 mt-0.5">Default passcode: <span className="font-mono font-bold">admin123</span></p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{loading ? 'Authenticating Admin...' : 'Enter Admin Control Panel'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </GlassCard>
        </div>

      </main>

      <footer className="p-4 text-center border-t border-slate-200/60 bg-white/50 backdrop-blur-sm z-10">
        <p className="text-xs font-bold text-slate-500">
          WEB X HACKATHON ATTENDANCE MANAGEMENT SYSTEM
        </p>
      </footer>

    </div>
  );
};
