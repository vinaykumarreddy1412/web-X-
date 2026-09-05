import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { useNavigation } from '../../context/RouterContext';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { activeSession, seedDemoData } = useAttendance();
  const { pathname, navigate } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const role = user?.role;

  const handleSeed = async () => {
    if (confirm('Seed 70 demo teams, 4 sessions, and sample attendance records?')) {
      setSeeding(true);
      try {
        await seedDemoData();
        alert('70 Demo Teams & Sessions successfully seeded into database!');
      } catch (e) {
        alert('Seeding completed.');
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    if (pathname === '/admin') {
      navigate('/admin');
    } else if (pathname === '/assistant') {
      navigate('/assistant');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Official WEB X Logo */}
          <div 
            onClick={() => {
              if (pathname === '/admin' && user?.role === 'admin') {
                setActiveTab('overview');
              } else if (pathname === '/assistant' && user?.role === 'assistant') {
                setActiveTab('dashboard');
              } else {
                navigate('/');
              }
            }} 
            className="flex items-center cursor-pointer group select-none shrink-0"
          >
            <img 
              src="/web-x-logo.jpeg" 
              alt="WEB X Logo" 
              className="h-10 sm:h-12 w-auto max-w-[180px] object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Active Session Badge */}
          {activeSession ? (
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active Session: <strong>{activeSession.sessionName}</strong></span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>No Active Session</span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {role === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'dashboard' ? 'bg-red-50 text-red-600 border border-red-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'team' ? 'bg-red-50 text-red-600 border border-red-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  My Team
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'history' ? 'bg-red-50 text-red-600 border border-red-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Attendance History
                </button>
              </>
            )}

            {role === 'assistant' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'scan' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Scan QR
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'manual' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Manual Entry
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'overview' || activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('take-attendance')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'take-attendance' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Take Attendance
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'sessions' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'teams' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Teams
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'audit' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Audit Logs
                </button>
                
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  title="Seed 70 teams and test sessions"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{seeding ? 'Seeding...' : 'Seed Data'}</span>
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user.teamNumber || user.username || 'User'}
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                    role === 'assistant' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {role === 'student' && (
            <>
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('team'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                My Team
              </button>
              <button
                onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Attendance History
              </button>
            </>
          )}

          {role === 'assistant' && (
            <>
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('scan'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Scan QR Code
              </button>
              <button
                onClick={() => { setActiveTab('manual'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Manual Reg Entry
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('take-attendance'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Take Attendance
              </button>
              <button
                onClick={() => { setActiveTab('sessions'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sessions
              </button>
              <button
                onClick={() => { setActiveTab('teams'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Teams
              </button>
              <button
                onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Attendance
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Reports
              </button>
              <button
                onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Audit Logs
              </button>
              <button
                onClick={() => { handleSeed(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50"
              >
                ⚡ Seed 70 Teams Demo Data
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
