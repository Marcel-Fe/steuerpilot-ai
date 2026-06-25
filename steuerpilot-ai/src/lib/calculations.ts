// Abgeleitete Werte — immer berechnet, nie gespeichert.

import type {
  ChecklistItem,
  Deadline,
  ExpenseCategory,
  IncomeEntry,
  Receipt,
  TaxProfile,
  YearData,
} from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { computeCrypto, FREIGRENZE_EUR } from './crypto';

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

export interface MonthSum {
  month: string; // "YYYY-MM"
  label: string; // "Jan", "Feb" …
  amount: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Ausgaben je Monat (chronologisch) — für den Verlaufs-Chart
export function expensesByMonth(receipts: Receipt[]): MonthSum[] {
  const totals = new Map<string, number>();
  for (const r of receipts) {
    const key = r.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + r.amount);
  }
  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, amount]) => ({
      month,
      label: MONTH_LABELS[parseInt(month.slice(5, 7), 10) - 1] ?? month,
      amount: Math.round(amount * 100) / 100,
    }));
}

export function totalIncome(income: IncomeEntry[]): number {
  return Math.round(income.reduce((s, i) => s + i.amount, 0) * 100) / 100;
}

// Reicher, datengestützter Kontext für die KI — modus- und jahresbewusst.
export function aiProfileContext(profile: TaxProfile, year: YearData) {
  const cats = expensesByCategory(year.receipts);
  const expenses = totalExpenses(year.receipts);
  const income = totalIncome(year.income);
  const crypto = computeCrypto(year.crypto);
  const isBusiness = year.mode === 'unternehmer';

  return {
    name: profile.name,
    role: profile.role,
    year: year.year,
    mode: isBusiness ? 'Unternehmer/Selbstständig' : 'Angestellter',
    receiptCount: year.receipts.length,
    expensesByCategory: cats.map((c) => `${c.label}: ${formatEuro(c.amount, true)} €`).join('; ') || 'keine',
    totalExpenses: formatEuro(expenses, true),
    income: isBusiness ? formatEuro(income, true) : null,
    profit: isBusiness ? formatEuro(income - expenses, true) : null,
    cryptoTaxable: formatEuro(crypto.taxableGains, true),
    cryptoTaxFree: formatEuro(crypto.taxFreeGains, true),
    cryptoOverFreigrenze: crypto.overFreigrenze,
    freigrenze: FREIGRENZE_EUR,
    potential: formatEuro(estimatedPotential(year.receipts)),
    openDeadlines: deadlineViews(year.deadlines)
      .filter((d) => d.status !== 'erledigt')
      .map((d) => `${d.title} (${d.dueDate}${d.overdue ? ', überfällig' : `, in ${d.daysLeft} Tagen`})`)
      .join('; ') || 'keine',
  };
}
