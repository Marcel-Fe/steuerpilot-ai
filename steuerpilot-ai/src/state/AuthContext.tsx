import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadAuth, saveAuth, hashPin, type AuthData } from './auth';
import { useApp } from './AppContext';
import { Onboarding } from '../components/Onboarding';
import { LockScreen } from '../components/LockScreen';
import type { TaxProfile } from '../types';

interface AuthContextValue {
  hasPin: boolean;
  lock: () => void;
  setPin: (pin: string) => Promise<void>;
  removePin: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { updateProfile } = useApp();
  const [auth, setAuth] = useState<AuthData>(() => loadAuth());
  const [locked, setLocked] = useState<boolean>(() => {
    const a = loadAuth();
    return a.onboarded && !!a.pinHash;
  });

  const completeOnboarding = useCallback(
    async (patch: Partial<TaxProfile>, pin?: string) => {
      updateProfile(patch);
      const pinHash = pin ? await hashPin(pin) : undefined;
      const next: AuthData = { onboarded: true, pinHash };
      saveAuth(next);
      setAuth(next);
      setLocked(false);
    },
    [updateProfile],
  );

  const lock = useCallback(() => {
    if (auth.pinHash) setLocked(true);
  }, [auth.pinHash]);

  const setPin = useCallback(
    async (pin: string) => {
      const pinHash = await hashPin(pin);
      const next: AuthData = { ...auth, pinHash };
      saveAuth(next);
      setAuth(next);
    },
    [auth],
  );

  const removePin = useCallback(() => {
    const next: AuthData = { ...auth, pinHash: undefined };
    saveAuth(next);
    setAuth(next);
  }, [auth]);

  const signOut = useCallback(() => {
    const next: AuthData = { onboarded: false };
    saveAuth(next);
    setAuth(next);
    setLocked(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ hasPin: !!auth.pinHash, lock, setPin, removePin, signOut }),
    [auth.pinHash, lock, setPin, removePin, signOut],
  );

  if (!auth.onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }
  if (locked && auth.pinHash) {
    return <LockScreen pinHash={auth.pinHash} onUnlock={() => setLocked(false)} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
