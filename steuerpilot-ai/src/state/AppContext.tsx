import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, ExpenseCategory } from '../types';
import { loadState, saveState, resetState, uid } from '../storage/store';

interface NewReceiptInput {
  date: string;
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  imageDataUrl?: string;
}

interface AppContextValue {
  state: AppState;
  addReceipt: (input: NewReceiptInput) => void;
  toggleChecklist: (id: string) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  const persist = useCallback((next: AppState) => {
    saveState(next);
    setState(next);
  }, []);

  const addReceipt = useCallback(
    (input: NewReceiptInput) => {
      setState((prev) => {
        const next: AppState = {
          ...prev,
          receipts: [
            {
              id: uid(),
              status: 'offen',
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...prev.receipts,
          ],
        };
        saveState(next);
        return next;
      });
    },
    [],
  );

  const toggleChecklist = useCallback((id: string) => {
    setState((prev) => {
      const next: AppState = {
        ...prev,
        checklist: prev.checklist.map((c) =>
          c.id === id ? { ...c, done: !c.done } : c,
        ),
      };
      saveState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(resetState());
  }, [persist]);

  const value = useMemo(
    () => ({ state, addReceipt, toggleChecklist, reset }),
    [state, addReceipt, toggleChecklist, reset],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
