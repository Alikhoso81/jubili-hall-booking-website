import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Staff } from './types';

interface AuthContextValue {
  user: User | null;
  staff: Staff | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function fallbackStaff(user: User): Staff {
  return {
    id: user.id,
    display_name: user.email ? user.email.split('@')[0] : 'Staff',
    email: user.email ?? '',
    role: 'admin',
    permissions: [],
    is_active: true,
  };
}

const STAFF_COLUMNS = 'id, display_name, email, role, permissions, is_active';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (current: User | null) => {
    if (!current) {
      setStaff(null);
      return;
    }
    const { data, error } = await supabase
      .from('staff')
      .select(STAFF_COLUMNS)
      .eq('id', current.id)
      .maybeSingle();
    setStaff(!error && data ? (data as Staff) : fallbackStaff(current));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) loadProfile(user);
    return () => {
      cancelled = true;
    };
  }, [user, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshStaff = useCallback(() => loadProfile(user), [loadProfile, user]);

  return (
    <AuthContext.Provider value={{ user, staff, loading, signIn, signOut, refreshStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
