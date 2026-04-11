// useAuth — CardioDil AI
// Supabase session management hook
// Used by all screens that read or write user data
// Founder tier (prasad.pagade@gmail.com) is seeded at the database level
// This hook only manages session state — no tier logic here

import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  session: Session | null;
  user: User | null;
  userId: string | null;
  loading: boolean;
  signedIn: boolean;
}

export function useAuth(): AuthState & {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing session from AsyncStorage on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for sign-in, sign-out, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return {
    session,
    user,
    userId: user?.id ?? null,
    loading,
    signedIn: !!user,
    signInWithEmail,
    signOut,
  };
}
