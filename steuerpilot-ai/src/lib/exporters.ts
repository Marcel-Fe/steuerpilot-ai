// CSV- und E-Mail-Export (für Steuerberater-Versand).

import type { Receipt, TaxProfile, YearData } from '../types';
import { CATEGORY_LABELS } from '../types';
import { expensesByCategory, totalExpenses, estimatedPotential, formatEuro } from './calculations';

function csvCell(value: string | number): string {
  const s = String(value).replace(/"/g, '""');
  return /[";\n]/.test(s) ? `"${s}"` : s;
}

export function receiptsToCsv(receipts: Receipt[]): string {
  const header = ['Datum', 'Händler/Zweck', 'Kategorie', 'Betrag (EUR)', 'Status'];
  const rows = [...receipts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => [r.date, r.vendor, CATEGORY_LABELS[r.category], r.amount.toFixed(2), r.status]);
  // Trennzeichen Semikolon (Excel-DE-freundlich)
  return [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadFile(filename: string, content: string, mime: string) {
  // BOM für korrekte Umlaute in Excel
  const blob = new Blob(['﻿' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Kompakte Zusammenfassung als E-Mail-Text (mailto hat Längenlimits → nur Übersicht,
// Details liegen in der CSV).
export function buildAdvisorEmail(profile: TaxProfile, year: YearData): { subject: string; body: string } {
  const receipts = year.receipts;
  const cats = expensesByCategory(receipts);
  const total = totalExpenses(receipts);
  const potential = estimatedPotential(receipts);

  const lines = [
    `Hallo,`,
    ``,
    `anbei meine Steuerunterlagen für ${year.year} (${profile.name}, ${profile.role}).`,
    ``,
    `Übersicht der Werbungskosten/Ausgaben:`,
    ...cats.map((c) => `- ${c.label}: ${formatEuro(c.amount, true)} €`),
    ``,
    `Gesamt: ${formatEuro(total, true)} € (${receipts.length} Belege)`,
    `Geschätztes Steuerpotenzial: ca. ${formatEuro(potential)} €`,
    ``,
    `Die vollständige Belegliste hängt als CSV-Datei an (bitte vor dem Senden anhängen).`,
    ``,
    `Viele Grüße`,
    profile.name,
  ];
  return {
    subject: `Steuerunterlagen ${year.year} – ${profile.name}`,
    body: lines.join('\n'),
  };
}

export function openAdvisorMail(profile: TaxProfile, year: YearData) {
  const { subject, body } = buildAdvisorEmail(profile, year);
  const to = profile.advisorEmail ?? '';
  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}
