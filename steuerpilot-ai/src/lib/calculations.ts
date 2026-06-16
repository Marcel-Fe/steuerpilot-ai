// Abgeleitete Werte — immer berechnet, nie gespeichert.

import type {
  AppState,
  ChecklistItem,
  Deadline,
  ExpenseCategory,
  Receipt,
} from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';

export function formatEuro(value: number, withCents = false): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  });
}

// Steuerfortschritt in Prozent (erledigte Checklisten-Items / gesamt)
export function taxProgress(checklist: ChecklistItem[]): number {
  if (!checklist.length) return 0;
  const done = checklist.filter((c) => c.done).length;
  return Math.round((done / checklist.length) * 100);
}

export interface CategorySum {
  category: ExpenseCategory;
  label: string;
  color: string;
  amount: number;
}

// Ausgaben je Kategorie + Reihenfolge nach Betrag (für Donut + Legende)
export function expensesByCategory(receipts: Receipt[]): CategorySum[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const r of receipts) {
    totals.set(r.category, (totals.get(r.category) ?? 0) + r.amount);
  }
  return (Object.keys(CATEGORY_LABELS) as ExpenseCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      color: CATEGORY_COLORS[category],
      amount: Math.round((totals.get(category) ?? 0) * 100) / 100,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function totalExpenses(receipts: Receipt[]): number {
  return Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100;
}

// Regelbasierte Schätzung der möglichen Erstattung (Prototyp).
// Annahme: ein Teil der absetzbaren Ausgaben mindert die Steuerlast
// (vereinfachter Grenzsteuersatz). In Phase 3 KI-gestützt.
const ASSUMED_TAX_RATE = 0.35;

export function estimatedPotential(receipts: Receipt[]): number {
  const deductible = totalExpenses(receipts);
  return Math.round(deductible * ASSUMED_TAX_RATE);
}

export interface DeadlineView extends Deadline {
  daysLeft: number;
  overdue: boolean;
}

export function deadlineViews(deadlines: Deadline[], today = new Date()): DeadlineView[] {
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return deadlines
    .map((d) => {
      const due = new Date(d.dueDate + 'T00:00:00');
      const daysLeft = Math.round((due.getTime() - startOfDay.getTime()) / 86400000);
      const overdue = d.status === 'überfällig' || (d.status !== 'erledigt' && daysLeft < 0);
      return { ...d, daysLeft, overdue };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Kompakter Profil-Kontext für den KI-Worker
export function aiProfileContext(state: AppState) {
  return {
    name: state.profile.name,
    role: state.profile.role,
    taxYear: state.profile.taxYear,
    receiptCount: state.receipts.length,
    totalExpenses: formatEuro(totalExpenses(state.receipts)),
  };
}
