import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: 'super-admin' | 'event-coordinator' | 'volunteer' | 'student';
  registrationNumber?: string;
  department?: string;
  year?: string;
  section?: string;
  phoneNumber?: string;
  participationPoints: number;
  streak: number;
  badges: string[];
  assignedEvent?: string;
  eventRole?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileComplete: boolean;
  login: (email: string, password: string) => Promise<{ profileComplete: boolean }>;
  register: (username: string, email: string, password: string) => Promise<{ profileComplete: boolean }>;
  completeProfile: (details: {
    name: string;
    registrationNumber: string;
    department: string;
    year: string;
    section: string;
    phoneNumber?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('campushub-token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileComplete, setProfileComplete] = useState<boolean>(true);

  // Restore Session on Mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setIsAuthenticated(true);
            
            // Check if profile is complete
            if (res.data.user.role === 'student') {
              const u = res.data.user;
              const complete = !!(u.registrationNumber && u.department && u.year && u.section);
              setProfileComplete(complete);
            } else {
              setProfileComplete(true);
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('campushub-token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setProfileComplete(res.data.profileComplete);
        setIsLoading(false);
        return { profileComplete: res.data.profileComplete };
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (err: any) {
      setIsLoading(false);
      throw err.response?.data?.message || err.message || 'Login failed';
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data.success) {
        localStorage.setItem('campushub-token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setProfileComplete(res.data.profileComplete);
        setIsLoading(false);
        return { profileComplete: res.data.profileComplete };
      }
      throw new Error(res.data.message || 'Registration failed');
    } catch (err: any) {
      setIsLoading(false);
      throw err.response?.data?.message || err.message || 'Registration failed';
    }
  };

  const completeProfile = async (details: any) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/complete-profile', details);
      if (res.data.success) {
        setUser(res.data.user);
        setProfileComplete(true);
      }
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      throw err.response?.data?.message || err.message || 'Profile completion failed';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campushub-token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setProfileComplete(true);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to refresh user profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        profileComplete,
        login,
        register,
        completeProfile,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
