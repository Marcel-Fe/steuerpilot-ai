import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  CryptoTransaction,
  Deadline,
  ExpenseCategory,
  Receipt,
  TaxProfile,
} from '../types';
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
  updateReceipt: (id: string, patch: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;
  toggleChecklist: (id: string) => void;
  addChecklistItem: (title: string, subtitle?: string) => void;
  deleteChecklistItem: (id: string) => void;
  upsertDeadline: (deadline: Deadline) => void;
  deleteDeadline: (id: string) => void;
  updateProfile: (patch: Partial<TaxProfile>) => void;
  addCrypto: (tx: Omit<CryptoTransaction, 'id'>) => void;
  deleteCrypto: (id: string) => void;
  replaceState: (next: AppState) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  // zentrale Mutation: berechnet next, persistiert und setzt State
  const mutate = useCallback((fn: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addReceipt = useCallback(
    (input: NewReceiptInput) =>
      mutate((prev) => ({
        ...prev,
        receipts: [
          { id: uid(), status: 'offen', createdAt: new Date().toISOString(), ...input },
          ...prev.receipts,
        ],
      })),
    [mutate],
  );

  const updateReceipt = useCallback(
    (id: string, patch: Partial<Receipt>) =>
      mutate((prev) => ({
        ...prev,
        receipts: prev.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    [mutate],
  );

  const deleteReceipt = useCallback(
    (id: string) =>
      mutate((prev) => ({ ...prev, receipts: prev.receipts.filter((r) => r.id !== id) })),
    [mutate],
  );

  const toggleChecklist = useCallback(
    (id: string) =>
      mutate((prev) => ({
        ...prev,
        checklist: prev.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
      })),
    [mutate],
  );

  const addChecklistItem = useCallback(
    (title: string, subtitle = '') =>
      mutate((prev) => ({
        ...prev,
        checklist: [...prev.checklist, { id: uid(), title, subtitle, done: false }],
      })),
    [mutate],
  );

  const deleteChecklistItem = useCallback(
    (id: string) =>
      mutate((prev) => ({ ...prev, checklist: prev.checklist.filter((c) => c.id !== id) })),
    [mutate],
  );

  const upsertDeadline = useCallback(
    (deadline: Deadline) =>
      mutate((prev) => {
        const exists = prev.deadlines.some((d) => d.id === deadline.id);
        return {
          ...prev,
          deadlines: exists
            ? prev.deadlines.map((d) => (d.id === deadline.id ? deadline : d))
            : [...prev.deadlines, deadline],
        };
      }),
    [mutate],
  );

  const deleteDeadline = useCallback(
    (id: string) =>
      mutate((prev) => ({ ...prev, deadlines: prev.deadlines.filter((d) => d.id !== id) })),
    [mutate],
  );

  const updateProfile = useCallback(
    (patch: Partial<TaxProfile>) =>
      mutate((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
    [mutate],
  );

  const addCrypto = useCallback(
    (tx: Omit<CryptoTransaction, 'id'>) =>
      mutate((prev) => ({ ...prev, crypto: [{ id: uid(), ...tx }, ...prev.crypto] })),
    [mutate],
  );

  const deleteCrypto = useCallback(
    (id: string) =>
      mutate((prev) => ({ ...prev, crypto: prev.crypto.filter((c) => c.id !== id) })),
    [mutate],
  );

  const replaceState = useCallback((next: AppState) => mutate(() => next), [mutate]);

  const reset = useCallback(() => {
    const seeded = resetState();
    setState(seeded);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      addReceipt,
      updateReceipt,
      deleteReceipt,
      toggleChecklist,
      addChecklistItem,
      deleteChecklistItem,
      upsertDeadline,
      deleteDeadline,
      updateProfile,
      addCrypto,
      deleteCrypto,
      replaceState,
      reset,
    }),
    [
      state,
      addReceipt,
      updateReceipt,
      deleteReceipt,
      toggleChecklist,
      addChecklistItem,
      deleteChecklistItem,
      upsertDeadline,
      deleteDeadline,
      updateProfile,
      addCrypto,
      deleteCrypto,
      replaceState,
      reset,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
