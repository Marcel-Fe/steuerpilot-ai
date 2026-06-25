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
  IncomeEntry,
  Receipt,
  TaxMode,
  TaxProfile,
  YearData,
} from '../types';
import { loadState, saveState, resetState, makeYear, uid } from '../storage/store';

interface NewReceiptInput {
  date: string;
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  imageDataUrl?: string;
}

interface AppContextValue {
  state: AppState;
  year: YearData; // aktives Steuerjahr
  // Jahre
  setActiveYear: (id: string) => void;
  addYear: (year: number, mode: TaxMode) => void;
  deleteYear: (id: string) => void;
  setYearMode: (mode: TaxMode) => void;
  setYearNumber: (year: number) => void;
  // Belege
  addReceipt: (input: NewReceiptInput) => void;
  updateReceipt: (id: string, patch: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;
  // Einnahmen (Unternehmer)
  addIncome: (input: Omit<IncomeEntry, 'id'>) => void;
  deleteIncome: (id: string) => void;
  // Checkliste
  toggleChecklist: (id: string) => void;
  addChecklistItem: (title: string, subtitle?: string) => void;
  deleteChecklistItem: (id: string) => void;
  // Fristen
  upsertDeadline: (deadline: Deadline) => void;
  deleteDeadline: (id: string) => void;
  // Krypto
  addCrypto: (tx: Omit<CryptoTransaction, 'id'>) => void;
  deleteCrypto: (id: string) => void;
  // Profil / global
  updateProfile: (patch: Partial<TaxProfile>) => void;
  replaceState: (next: AppState) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  const mutate = useCallback((fn: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Hilfsfunktion: verändert nur das aktive Jahr
  const mutateYear = useCallback(
    (fn: (y: YearData) => YearData) =>
      mutate((prev) => ({
        ...prev,
        years: prev.years.map((y) => (y.id === prev.activeYearId ? fn(y) : y)),
      })),
    [mutate],
  );

  // --- Jahre ---
  const setActiveYear = useCallback((id: string) => mutate((prev) => ({ ...prev, activeYearId: id })), [mutate]);

  const addYear = useCallback(
    (year: number, mode: TaxMode) =>
      mutate((prev) => {
        const existing = prev.years.find((y) => y.year === year);
        if (existing) return { ...prev, activeYearId: existing.id };
        const fresh = makeYear(year, mode);
        return { ...prev, years: [...prev.years, fresh].sort((a, b) => b.year - a.year), activeYearId: fresh.id };
      }),
    [mutate],
  );

  const deleteYear = useCallback(
    (id: string) =>
      mutate((prev) => {
        if (prev.years.length <= 1) return prev; // mind. ein Jahr behalten
        const years = prev.years.filter((y) => y.id !== id);
        const activeYearId = prev.activeYearId === id ? years[0].id : prev.activeYearId;
        return { ...prev, years, activeYearId };
      }),
    [mutate],
  );

  const setYearMode = useCallback((mode: TaxMode) => mutateYear((y) => ({ ...y, mode })), [mutateYear]);

  const setYearNumber = useCallback((yearNum: number) => mutateYear((y) => ({ ...y, year: yearNum })), [mutateYear]);

  // --- Belege ---
  const addReceipt = useCallback(
    (input: NewReceiptInput) =>
      mutateYear((y) => ({
        ...y,
        receipts: [{ id: uid(), status: 'offen', createdAt: new Date().toISOString(), ...input }, ...y.receipts],
      })),
    [mutateYear],
  );

  const updateReceipt = useCallback(
    (id: string, patch: Partial<Receipt>) =>
      mutateYear((y) => ({ ...y, receipts: y.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
    [mutateYear],
  );

  const deleteReceipt = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, receipts: y.receipts.filter((r) => r.id !== id) })),
    [mutateYear],
  );

  // --- Einnahmen ---
  const addIncome = useCallback(
    (input: Omit<IncomeEntry, 'id'>) => mutateYear((y) => ({ ...y, income: [{ id: uid(), ...input }, ...y.income] })),
    [mutateYear],
  );

  const deleteIncome = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, income: y.income.filter((i) => i.id !== id) })),
    [mutateYear],
  );

  // --- Checkliste ---
  const toggleChecklist = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, checklist: y.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) })),
    [mutateYear],
  );

  const addChecklistItem = useCallback(
    (title: string, subtitle = '') =>
      mutateYear((y) => ({ ...y, checklist: [...y.checklist, { id: uid(), title, subtitle, done: false }] })),
    [mutateYear],
  );

  const deleteChecklistItem = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, checklist: y.checklist.filter((c) => c.id !== id) })),
    [mutateYear],
  );

  // --- Fristen ---
  const upsertDeadline = useCallback(
    (deadline: Deadline) =>
      mutateYear((y) => {
        const exists = y.deadlines.some((d) => d.id === deadline.id);
        return {
          ...y,
          deadlines: exists ? y.deadlines.map((d) => (d.id === deadline.id ? deadline : d)) : [...y.deadlines, deadline],
        };
      }),
    [mutateYear],
  );

  const deleteDeadline = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, deadlines: y.deadlines.filter((d) => d.id !== id) })),
    [mutateYear],
  );

  // --- Krypto ---
  const addCrypto = useCallback(
    (tx: Omit<CryptoTransaction, 'id'>) => mutateYear((y) => ({ ...y, crypto: [{ id: uid(), ...tx }, ...y.crypto] })),
    [mutateYear],
  );

  const deleteCrypto = useCallback(
    (id: string) => mutateYear((y) => ({ ...y, crypto: y.crypto.filter((c) => c.id !== id) })),
    [mutateYear],
  );

  // --- Profil / global ---
  const updateProfile = useCallback(
    (patch: Partial<TaxProfile>) => mutate((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
    [mutate],
  );

  const replaceState = useCallback((next: AppState) => mutate(() => next), [mutate]);

  const reset = useCallback(() => setState(resetState()), []);

  const year = useMemo(
    () => state.years.find((y) => y.id === state.activeYearId) ?? state.years[0],
    [state],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state, year,
      setActiveYear, addYear, deleteYear, setYearMode, setYearNumber,
      addReceipt, updateReceipt, deleteReceipt,
      addIncome, deleteIncome,
      toggleChecklist, addChecklistItem, deleteChecklistItem,
      upsertDeadline, deleteDeadline,
      addCrypto, deleteCrypto,
      updateProfile, replaceState, reset,
    }),
    [
      state, year,
      setActiveYear, addYear, deleteYear, setYearMode, setYearNumber,
      addReceipt, updateReceipt, deleteReceipt,
      addIncome, deleteIncome,
      toggleChecklist, addChecklistItem, deleteChecklistItem,
      upsertDeadline, deleteDeadline,
      addCrypto, deleteCrypto,
      updateProfile, replaceState, reset,
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
