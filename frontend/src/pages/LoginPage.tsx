import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SpotlightCard } from '../components/SpotlightCard';
import { KeyRound, Mail, UserCheck, GraduationCap, Phone, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoginPage: React.FC = () => {
  const { login, register, completeProfile, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Fields
  const [registerUsername, setRegisterUsername] = useState('');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password Fields
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Profile completion modal / sub-view
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [dept, setDept] = useState('Information Technology');
  const [year, setYear] = useState('3rd');
  const [section, setSection] = useState('A');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.profileComplete) {
        setShowCompletionForm(true);
      } else {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        // The dashboard/admin redirect will be handled by PrivateRoutes, but we'll force navigation
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerEmail || !registerPassword) {
      setError('Please enter all details');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await register(registerUsername, registerEmail, registerPassword);
      if (!result.profileComplete) {
        setShowCompletionForm(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeProfile({
        name,
        registrationNumber: regNo,
        department: dept,
        year,
        section,
        phoneNumber: phone
      });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !forgotNewPassword) {
      setError('Please enter all details to reset your password');
      return;
    }
    setError(null);
    setResetSuccessMessage(null);
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          email: forgotEmail,
          newPassword: forgotNewPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');
      
      setResetSuccessMessage('Password reset successfully! You can now login.');
      setForgotUsername('');
      setForgotEmail('');
      setForgotNewPassword('');
      setTimeout(() => setActiveTab('login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-secondary/15 blur-[80px]" />

      {!showCompletionForm ? (
        <div className="relative w-full max-w-md z-10 font-sans">
          <SpotlightCard className="w-full p-8 glassmorphism-card flex flex-col justify-between" glowColor="rgba(37, 99, 235, 0.15)">
            <div>
              <div className="flex flex-col items-center mb-6 text-center">
                <img src="/gtec_logo.png" alt="GTEC Logo" className="w-16 h-16 object-contain rounded-xl mb-3 shadow-md" />
                <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Information technology</h1>
                <p className="text-xs text-muted-foreground mt-1">Sign in or create an account</p>
              </div>

              {/* Error Message banner */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-xs text-red-400">
                  <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Toggle Switch Tabs */}
              {activeTab !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(null); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(null); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Register
                </button>
              </div>
              )}

              {/* Success Message for Reset */}
              {resetSuccessMessage && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center text-xs text-green-500">
                  <UserCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}


              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Email or Username</label>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="you@example.com or username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-foreground">Password</label>
                      <button type="button" onClick={() => { setActiveTab('forgot'); setError(null); setResetSuccessMessage(null); }} className="text-xs text-primary hover:underline font-semibold">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-4 pr-16 py-2.5 text-sm text-foreground transition-all outline-none"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-primary hover:text-primary/80"
                      >
                        {showLoginPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-md clickable disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                    {!loading && <span>&rarr;</span>}
                  </button>
                  
                  <div className="text-center pt-2">
                    <span className="text-xs text-muted-foreground">
                      New to Portal?{' '}
                      <button type="button" onClick={() => setActiveTab('register')} className="text-primary font-bold hover:underline">
                        Create account
                      </button>
                    </span>
                  </div>
                </form>
              ) : activeTab === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Username</label>
                    <input
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="e.g. aditya_sharma"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Email Address</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="student@gtec.edu.in"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Password</label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-4 pr-16 py-2.5 text-sm text-foreground transition-all outline-none"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-primary hover:text-primary/80"
                      >
                        {showRegisterPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-md clickable disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Registering...' : 'Create account'}
                    {!loading && <span>&rarr;</span>}
                  </button>
                  
                  <div className="text-center pt-2">
                    <span className="text-xs text-muted-foreground">
                      Already have an account?{' '}
                      <button type="button" onClick={() => setActiveTab('login')} className="text-primary font-bold hover:underline">
                        Sign In
                      </button>
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Username</label>
                    <input
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="Your username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="Your registered email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">New Password</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none"
                      placeholder="Enter new password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-md clickable disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setActiveTab('login')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      &larr; Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-center pt-6">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                &larr; Back to Landing Page
              </button>
            </div>
          </SpotlightCard>
        </div>
      ) : (
        /* Profile Completion Screen */
        <SpotlightCard className="w-full max-w-lg p-6 sm:p-8 glassmorphism-card z-10" glowColor="rgba(255, 193, 7, 0.15)">
          <div className="text-center mb-6">
            <div className="p-3 bg-secondary/15 rounded-2xl w-12 h-12 flex items-center justify-center border border-secondary/20 mx-auto mb-3">
              <UserCheck className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Complete Student Profile</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Hi <strong>{user?.username || registerUsername}</strong>, complete your academic details once to unlock instant event bookings.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive-foreground">
              {error}
            </div>
          )}

          <form onSubmit={handleProfileCompletionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Username</label>
                <input
                  type="text"
                  value={user?.username || registerUsername}
                  disabled
                  className="w-full bg-muted border border-muted rounded-xl px-3 py-2.5 text-xs text-muted-foreground opacity-75 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs text-foreground transition-all outline-none"
                  placeholder="e.g. Aditya Sharma"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">College Email</label>
                <input
                  type="email"
                  value={user?.email || registerEmail}
                  disabled
                  className="w-full bg-muted border border-muted rounded-xl px-3 py-2.5 text-xs text-muted-foreground opacity-75 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Registration Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    required
                    placeholder="e.g. SRM12345"
                    className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Department</label>
                <input
                  type="text"
                  value="Information Technology"
                  disabled
                  className="w-full bg-muted border border-muted rounded-xl px-3 py-2.5 text-xs text-muted-foreground opacity-75 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Academic Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs text-foreground transition-all outline-none"
                >
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  placeholder="A"
                  className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs text-foreground transition-all outline-none text-center"
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-8 pr-3 py-2.5 text-xs text-foreground transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs font-bold rounded-xl transition-all shadow-md mt-4 clickable disabled:opacity-50"
            >
              {loading ? 'Saving details...' : 'Unlock Information Technology'}
            </button>
          </form>
        </SpotlightCard>
      )}
    </div>
  );
};
