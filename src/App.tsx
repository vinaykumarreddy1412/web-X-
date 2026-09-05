import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { NavigationProvider, useNavigation } from './context/RouterContext';
import { SpiderBackground } from './components/common/SpiderBackground';
import { Navbar } from './components/common/Navbar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { AssistantDashboard } from './components/assistant/AssistantDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AssistantLogin } from './components/auth/AssistantLogin';
import { AdminLogin } from './components/auth/AdminLogin';
import { StudentLogin } from './components/auth/StudentLogin';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { pathname } = useNavigation();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading Web X Attendance Portal..." />
      </div>
    );
  }

  // 1. Assistant Portal Route: /assistant
  if (pathname === '/assistant') {
    // If not authenticated as assistant, show protected Assistant Login
    if (user?.role !== 'assistant') {
      return <AssistantLogin />;
    }
    // Protected Assistant Dashboard
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <AssistantDashboard />
        </main>
      </div>
    );
  }

  // 2. Admin Portal Route: /admin
  if (pathname === '/admin') {
    // If not authenticated as admin, show protected Admin Login
    if (user?.role !== 'admin') {
      return <AdminLogin />;
    }
    // Protected Admin Dashboard
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>
      </div>
    );
  }

  // 3. Default Route: / (Student Portal with Mail Login)
  if (!user || user.role !== 'student') {
    return <StudentLogin />;
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <StudentDashboard />
      </main>
    </div>
  );
};

export function App() {
  return (
    <NavigationProvider>
      <AuthProvider>
        <AttendanceProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 text-slate-900 selection:bg-red-500 selection:text-white font-sans">
            <SpiderBackground />
            <MainContent />
          </div>
        </AttendanceProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}

export default App;

