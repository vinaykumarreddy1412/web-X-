import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { AuthUser, Team } from '../types';
import { fetchAllTeams, fetchTeamByNumber, logAuditEvent } from '../services/firebaseService';

interface AuthContextType {
  user: AuthUser | null;
  currentTeam: Team | null;
  loading: boolean;
  loginWithGoogleStudent: () => Promise<{ success: boolean; message?: string }>;
  loginWithStudentEmail: (emailOrReg: string) => Promise<{ success: boolean; message?: string }>;
  loginAsAssistant: (passcode: string) => Promise<{ success: boolean; message?: string }>;
  loginAsAdmin: (passcode: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshTeamData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'webx_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUser) {
      try {
        const parsed: AuthUser = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role === 'student' && parsed.teamNumber) {
          fetchTeamByNumber(parsed.teamNumber).then(team => {
            if (team) setCurrentTeam(team);
          });
        }
      } catch (e) {
        console.error('Failed to parse saved auth user:', e);
      }
    }
    setLoading(false);
  }, []);

  const refreshTeamData = async () => {
    if (user?.role === 'student' && user.teamNumber) {
      const updatedTeam = await fetchTeamByNumber(user.teamNumber);
      if (updatedTeam) setCurrentTeam(updatedTeam);
    }
  };

  const loginWithGoogleStudent = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        hd: 'klu.ac.in',
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const email = (result.user.email || '').trim().toLowerCase();

      // 1. STRICT DOMAIN RESTRICTION TO @klu.ac.in ONLY
      if (!email.endsWith('@klu.ac.in')) {
        await firebaseSignOut(auth);
        return {
          success: false,
          message: `Access Denied: Only official @klu.ac.in Google accounts are permitted. (Signed in as: ${email})`
        };
      }

      // 2. Extract student registration number from email (e.g. 2200031234@klu.ac.in -> 2200031234)
      const regdno = email.replace('@klu.ac.in', '').trim().toUpperCase();
      const displayName = result.user.displayName || regdno;

      // 3. Search all registered teams in Firestore
      const allTeams = await fetchAllTeams();
      
      let matchedMemberName = '';
      const matchedTeam = allTeams.find(t => {
        // Check Team Lead registration number or email
        if (t.teamLeadRegNo?.trim().toUpperCase() === regdno || (t as any).teamLeadEmail?.trim().toLowerCase() === email) {
          matchedMemberName = t.teamLeadName;
          return true;
        }

        // Check any of the 4 team members
        if (t.members && Array.isArray(t.members)) {
          const foundMember = t.members.find(m => 
            m.regNo?.trim().toUpperCase() === regdno || 
            (m as any).email?.trim().toLowerCase() === email
          );
          if (foundMember) {
            matchedMemberName = foundMember.name;
            return true;
          }
        }

        return false;
      });

      // 4. If email/regdno is NOT registered in any team -> Show error & Reject login
      if (!matchedTeam) {
        await firebaseSignOut(auth);
        return {
          success: false,
          message: `This student is not registered (Reg No: ${regdno}, Email: ${email}). Please contact Web X Hackathon Admin to register your team.`
        };
      }

      // 5. Successfully matched -> Log in student and display their team details
      const studentUser: AuthUser = {
        role: 'student',
        username: matchedMemberName || displayName,
        email: email,
        teamNumber: matchedTeam.teamNumber,
        teamName: matchedTeam.teamName,
        teamLeadRegNo: matchedTeam.teamLeadRegNo,
        teamLeadName: matchedTeam.teamLeadName
      };

      setUser(studentUser);
      setCurrentTeam(matchedTeam);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));

      logAuditEvent(
        'STUDENT_GOOGLE_LOGIN', 
        email, 
        'student', 
        `Student ${regdno} (${matchedMemberName || displayName}) from Team ${matchedTeam.teamNumber} logged in via KLU Google Auth`
      );

      return { success: true };
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Google Sign-in was cancelled.' };
      }
      if (error?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
        return { 
          success: false, 
          message: `Domain "${domain}" is not added in Firebase. Add "${domain}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.` 
        };
      }
      return { 
        success: false, 
        message: error?.message || 'Google sign-in failed. Please verify your internet and try again.' 
      };
    }
  };

  const loginWithStudentEmail = async (rawEmailOrReg: string) => {
    try {
      const raw = rawEmailOrReg.trim();
      if (!raw) {
        return { success: false, message: 'Please enter your student email, registration number, or team ID.' };
      }

      const allTeams = await fetchAllTeams();
      const upperRaw = raw.toUpperCase().replace(/\s+/g, '');
      const normalizedTeam = upperRaw.replace('-', '');

      // 1. Direct match by team number (e.g. TEAM001, TEAM-01, 001, 1)
      let matchedTeam = allTeams.find(t => {
        const tNum = t.teamNumber.toUpperCase().replace('-', '');
        return tNum === normalizedTeam || t.teamNumber.toUpperCase() === upperRaw;
      });

      let matchedMemberName = '';
      let emailUsed = '';

      if (matchedTeam) {
        matchedMemberName = matchedTeam.teamLeadName;
        emailUsed = `${matchedTeam.teamLeadRegNo.toLowerCase()}@klu.ac.in`;
      } else {
        // 2. Match by email or registration number
        let input = raw.toLowerCase();
        if (!input.includes('@')) {
          input = `${input}@klu.ac.in`;
        }

        const regdno = input.replace('@klu.ac.in', '').trim().toUpperCase();
        matchedTeam = allTeams.find(t => {
          if (t.teamLeadRegNo?.trim().toUpperCase() === regdno || (t as any).teamLeadEmail?.trim().toLowerCase() === input) {
            matchedMemberName = t.teamLeadName;
            return true;
          }
          if (t.members && Array.isArray(t.members)) {
            const foundMember = t.members.find(m => 
              m.regNo?.trim().toUpperCase() === regdno || 
              (m as any).email?.trim().toLowerCase() === input
            );
            if (foundMember) {
              matchedMemberName = foundMember.name;
              return true;
            }
          }
          return false;
        });

        if (!matchedTeam) {
          return {
            success: false,
            message: `No team found for "${raw}". Try registration ID (e.g. 22CSE1001) or Team Number (e.g. TEAM001).`
          };
        }

        emailUsed = input;
      }

      const userDisplayId = matchedTeam.teamLeadRegNo || matchedTeam.teamNumber;

      const studentUser: AuthUser = {
        role: 'student',
        username: matchedMemberName || userDisplayId,
        email: emailUsed || `${matchedTeam.teamLeadRegNo.toLowerCase()}@klu.ac.in`,
        teamNumber: matchedTeam.teamNumber,
        teamName: matchedTeam.teamName,
        teamLeadRegNo: matchedTeam.teamLeadRegNo,
        teamLeadName: matchedTeam.teamLeadName
      };

      setUser(studentUser);
      setCurrentTeam(matchedTeam);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));

      logAuditEvent(
        'STUDENT_MAIL_LOGIN', 
        emailUsed || userDisplayId, 
        'student', 
        `Student ${userDisplayId} (${matchedMemberName}) from Team ${matchedTeam.teamNumber} logged in with email/ID`
      );

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const loginAsAssistant = async (passcode: string) => {
    if (passcode.trim() !== 'webx2026' && passcode.trim() !== 'assistant') {
      return { success: false, message: 'Invalid Assistant Key.' };
    }

    const assistantUser: AuthUser = {
      role: 'assistant',
      username: 'Attendance Assistant',
      email: 'assistant@webx.hackathon'
    };

    setUser(assistantUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(assistantUser));

    logAuditEvent('ASSISTANT_LOGIN', 'Assistant', 'assistant', 'Assistant logged into Assistant Portal');

    return { success: true };
  };

  const loginAsAdmin = async (passcode: string) => {
    if (passcode.trim() !== 'Vinay@83' && passcode.trim() !== 'admin123') {
      return { success: false, message: 'Invalid Admin Password.' };
    }

    const adminUser: AuthUser = {
      role: 'admin',
      username: 'Web X Lead Admin (Vinay)',
      email: 'admin@webx.hackathon'
    };

    setUser(adminUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));

    logAuditEvent('ADMIN_LOGIN', 'Admin', 'admin', 'Admin logged into Admin Portal');

    return { success: true };
  };

  const logout = async () => {
    if (user) {
      logAuditEvent('LOGOUT', user.teamNumber || user.username || 'User', user.role || 'guest', 'User logged out');
    }
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    setUser(null);
    setCurrentTeam(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentTeam,
      loading,
      loginWithGoogleStudent,
      loginWithStudentEmail,
      loginAsAssistant,
      loginAsAdmin,
      logout,
      refreshTeamData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
