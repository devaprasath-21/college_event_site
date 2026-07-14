import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { SpotlightCard } from '../components/SpotlightCard';
import { KeyRound, Mail, ShieldAlert, Loader2 } from 'lucide-react';

export const SSOLoginPage: React.FC = () => {
  const { login, isAuthenticated, token, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // If the user is already authenticated and we have a redirect URI, redirect them immediately.
    if (!isLoading && isAuthenticated && token && redirectUri) {
      // Small delay to show the authorizing UI
      const timer = setTimeout(() => {
        window.location.href = `${redirectUri}?token=${token}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, redirectUri, isLoading]);

  if (!redirectUri) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SpotlightCard className="p-8 max-w-md w-full border border-destructive/30">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Request</h2>
            <p className="text-muted-foreground">
              Missing redirect URL. Please return to the external site and try logging in again.
            </p>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password');
      return;
    }
    setError(null);
    setIsLoggingIn(true);
    try {
      // The login function in AuthContext saves the token in localStorage and updates the state.
      // The useEffect above will trigger once `isAuthenticated` and `token` are set.
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err);
      setIsLoggingIn(false);
    }
  };

  // If loading auth state, or if authenticated (waiting to redirect)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SpotlightCard className="p-8 max-w-md w-full border border-primary/20">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Authorizing...</h2>
              <p className="text-sm text-muted-foreground break-all">
                You are being securely redirected back to <br />
                <span className="font-semibold text-primary">{new URL(redirectUri).hostname}</span>
              </p>
            </div>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <SpotlightCard className="w-full max-w-md p-8 relative z-10 border border-primary/10 bg-card/50 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Secure Login</h1>
          <p className="text-sm text-muted-foreground leading-relaxed break-all">
            Login with your College Event Site credentials to access <br />
            <span className="font-semibold text-foreground">{new URL(redirectUri).hostname}</span>
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full mt-4 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Authorize & Login'
            )}
          </button>
        </form>
      </SpotlightCard>
    </div>
  );
};
