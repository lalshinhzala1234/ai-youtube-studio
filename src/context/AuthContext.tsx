'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  resetPasswordForEmail,
  getCurrentUserAndSession,
  AuthResponse,
} from '@/lib/supabase/auth';

export type AuthModalMode = 'login' | 'signup' | 'forgot-password';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null; message: string | null }>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  isConfigured: false,
  isAuthModalOpen: false,
  authModalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signIn: async () => ({ user: null, session: null, error: 'Auth not initialized' }),
  signUp: async () => ({ user: null, session: null, error: 'Auth not initialized' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'Auth not initialized', message: null }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { user: initialUser, session: initialSession } = await getCurrentUserAndSession();
        if (isMounted) {
          setUser(initialUser);
          setSession(initialSession);
        }
      } catch (e) {
        console.warn('Auth initialization error:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, currentSession) => {
          if (isMounted) {
            setSession(currentSession);
            setUser(currentSession?.user || null);
            setLoading(false);
          }
        });

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } catch (e) {
        console.warn('Supabase onAuthStateChange error:', e);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleSignIn = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await signInWithEmail(email, password);
    if (!res.error && res.user) {
      setUser(res.user);
      setSession(res.session);
      setIsAuthModalOpen(false);
    }
    return res;
  };

  const handleSignUp = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await signUpWithEmail(email, password);
    if (!res.error && res.user) {
      setUser(res.user);
      setSession(res.session);
      setIsAuthModalOpen(false);
    }
    return res;
  };

  const handleSignOut = async (): Promise<void> => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  const handleResetPassword = async (email: string) => {
    return await resetPasswordForEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
