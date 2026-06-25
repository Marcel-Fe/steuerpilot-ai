import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, cloudConfigured, STATE_TABLE } from '../lib/supabase';
import { useApp } from './AppContext';
import type { AppState } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CloudContextValue {
  configured: boolean;
  email: string | null;
  status: SyncStatus;
  message: string;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const CloudContext = createContext<CloudContextValue | null>(null);

export function CloudProvider({ children }: { children: ReactNode }) {
  const { state, replaceState } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('');

  const stateRef = useRef<AppState>(state);
  stateRef.current = state;
  const suppressPush = useRef(false); // verhindert Push während des Pulls
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Laden des entfernten Zustands; ist keiner da, lokalen hochladen.
  const pull = useCallback(async () => {
    const sb = supabase;
    if (!sb) return;
    const { data: sess } = await sb.auth.getUser();
    const uid = sess.user?.id;
    if (!uid) return;
    setStatus('syncing');
    const { data, error } = await sb.from(STATE_TABLE).select('data').eq('user_id', uid).maybeSingle();
    if (error) {
      setStatus('error');
      setMessage('Sync-Fehler: ' + error.message);
      return;
    }
    if (data?.data) {
      suppressPush.current = true;
      replaceState(data.data as AppState);
      setTimeout(() => (suppressPush.current = false), 300);
    } else {
      await sb.from(STATE_TABLE).upsert({ user_id: uid, data: stateRef.current, updated_at: new Date().toISOString() });
    }
    setStatus('synced');
    setMessage('Mit Cloud synchronisiert.');
  }, [replaceState]);

  // Session beobachten
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Nach Login: Daten ziehen
  useEffect(() => {
    if (session) pull();
  }, [session, pull]);

  // Lokale Änderungen automatisch hochladen (debounced)
  useEffect(() => {
    const sb = supabase;
    if (!sb || !session || suppressPush.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const uid = session.user.id;
      setStatus('syncing');
      const { error } = await sb
        .from(STATE_TABLE)
        .upsert({ user_id: uid, data: stateRef.current, updated_at: new Date().toISOString() });
      setStatus(error ? 'error' : 'synced');
      if (!error) setMessage('Gespeichert in der Cloud.');
    }, 1200);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state, session]);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = supabase;
    if (!sb) return;
    setMessage('');
    const { error } = await sb.auth.signUp({ email, password });
    if (error) { setMessage(error.message); throw error; }
    setMessage('Konto erstellt. Prüfe ggf. dein E-Mail-Postfach zur Bestätigung.');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = supabase;
    if (!sb) return;
    setMessage('');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); throw error; }
  }, []);

  const signOut = useCallback(async () => {
    const sb = supabase;
    if (!sb) return;
    await sb.auth.signOut();
    setStatus('idle');
    setMessage('Abgemeldet.');
  }, []);

  const value = useMemo<CloudContextValue>(
    () => ({
      configured: cloudConfigured(),
      email: session?.user?.email ?? null,
      status,
      message,
      signUp,
      signIn,
      signOut,
      syncNow: pull,
    }),
    [session, status, message, signUp, signIn, signOut, pull],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCloud(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error('useCloud must be used within CloudProvider');
  return ctx;
}
