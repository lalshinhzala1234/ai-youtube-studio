import { getSupabaseClient, isSupabaseConfigured } from './client';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

// Local mock storage key for when Supabase is running in offline demo mode
const LOCAL_MOCK_USER_KEY = 'ai_yt_studio_local_user';
const LOCAL_MOCK_ACCOUNTS_KEY = 'ai_yt_studio_local_accounts';

interface MockAccount {
  id: string;
  email: string;
  passwordHash: string;
  created_at: string;
}

function getLocalMockAccounts(): MockAccount[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_MOCK_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalMockAccounts(accounts: MockAccount[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MOCK_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save mock accounts:', e);
  }
}

function createMockUser(id: string, email: string): User {
  return {
    id,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { email },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email,
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

function createMockSession(user: User): Session {
  return {
    access_token: 'mock-access-token-' + user.id,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token-' + user.id,
    user,
  };
}

export function sanitizeAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  const msg = typeof error === 'string' ? error : (error as { message?: string }).message || String(error);

  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Please verify your email address to sign in. Check your inbox for the confirmation link.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please double-check your credentials.';
  }
  if (msg.includes('User already registered') || msg.includes('user_already_exists') || msg.includes('duplicate key')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('rate limit') || msg.includes('over_request_rate_limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection error. Please check your internet connection.';
  }
  return msg;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return { user: null, session: null, error: 'Email and password are required.' };
  }
  if (password.length < 6) {
    return { user: null, session: null, error: 'Password must be at least 6 characters.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (error) {
        return { user: null, session: null, error: sanitizeAuthError(error) };
      }
      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: sanitizeAuthError(err) };
    }
  }

  // Fallback Mock Local Auth for offline/unconfigured environments
  const accounts = getLocalMockAccounts();
  const existing = accounts.find((a) => a.email === trimmedEmail);
  if (existing) {
    return {
      user: null,
      session: null,
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  const newId = 'usr_' + Math.random().toString(36).substring(2, 10);
  const newAccount: MockAccount = {
    id: newId,
    email: trimmedEmail,
    passwordHash: btoa(password), // simple mock hashing
    created_at: new Date().toISOString(),
  };
  accounts.push(newAccount);
  saveLocalMockAccounts(accounts);

  const mockUser = createMockUser(newId, trimmedEmail);
  const mockSession = createMockSession(mockUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_MOCK_USER_KEY, JSON.stringify({ user: mockUser, session: mockSession }));
  }

  return { user: mockUser, session: mockSession, error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return { user: null, session: null, error: 'Email and password are required.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        return { user: null, session: null, error: sanitizeAuthError(error) };
      }
      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: sanitizeAuthError(err) };
    }
  }

  // Fallback Mock Local Auth
  const accounts = getLocalMockAccounts();
  const found = accounts.find((a) => a.email === trimmedEmail);
  if (!found || found.passwordHash !== btoa(password)) {
    return { user: null, session: null, error: 'Invalid email or password. Please double-check your credentials.' };
  }

  const mockUser = createMockUser(found.id, found.email);
  const mockSession = createMockSession(mockUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_MOCK_USER_KEY, JSON.stringify({ user: mockUser, session: mockSession }));
  }

  return { user: mockUser, session: mockSession, error: null };
}

export async function resetPasswordForEmail(email: string): Promise<{ error: string | null; message: string | null }> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { error: 'Please enter your email address.', message: null };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.auth.resetPasswordForEmail(trimmedEmail);
      if (error) {
        return { error: sanitizeAuthError(error), message: null };
      }
      return {
        error: null,
        message: 'Password reset link has been sent to your email. Please check your inbox.',
      };
    } catch (err) {
      return { error: sanitizeAuthError(err), message: null };
    }
  }

  // Fallback Mock response
  return {
    error: null,
    message: 'Password reset instructions have been dispatched to ' + trimmedEmail + '.',
  };
}

export async function signOutUser(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        return { error: sanitizeAuthError(error) };
      }
    } catch (err) {
      return { error: sanitizeAuthError(err) };
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_MOCK_USER_KEY);
  }
  return { error: null };
}

export async function getCurrentUserAndSession(): Promise<{ user: User | null; session: Session | null }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const sessionPromise = client.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 1500)
      );
      const res = await Promise.race([sessionPromise, timeoutPromise]);
      const session = res?.data?.session;
      if (session?.user) {
        return { user: session.user, session };
      }
    } catch (err) {
      console.warn('Error fetching Supabase session:', err);
    }
  }

  // Fallback Mock
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_MOCK_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { user: parsed.user || null, session: parsed.session || null };
      }
    } catch {
      // ignore
    }
  }

  return { user: null, session: null };
}
