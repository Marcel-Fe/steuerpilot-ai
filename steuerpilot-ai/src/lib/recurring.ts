// Automatik für wiederkehrende Kosten: erzeugt fällige Belege im aktiven Jahr.

import type { Receipt, RecurringCost, RecurringInterval, YearData } from '../types';

function addInterval(date: Date, interval: RecurringInterval): Date {
  const d = new Date(date);
  if (interval === 'monatlich') d.setMonth(d.getMonth() + 1);
  else if (interval === 'quartal') d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Liefert fällige Belege (noch nicht gebucht, Datum ≤ heute, im Jahr des YearData).
export function dueReceipts(year: YearData, today = new Date()): Receipt[] {
  const result: Receipt[] = [];
  for (const rc of year.recurring) {
    let cursor = rc.lastPosted
      ? addInterval(new Date(rc.lastPosted + 'T00:00:00'), rc.interval)
      : new Date(rc.startDate + 'T00:00:00');
    let guard = 0;
    while (cursor <= today && guard < 240) {
      guard++;
      if (cursor.getFullYear() === year.year) {
        result.push({
          id: uid(),
          date: cursor.toISOString().slice(0, 10),
          vendor: `${rc.name} (wiederkehrend)`,
          amount: rc.amount,
          category: rc.category,
          status: 'geprüft',
          createdAt: new Date().toISOString(),
        });
      } else if (cursor.getFullYear() > year.year) {
        break;
      }
      cursor = addInterval(cursor, rc.interval);
    }
  }
  return result;
}

// Bucht alle fälligen Belege und aktualisiert lastPosted der Kostenstellen.
export function applyRecurring(year: YearData, today = new Date()): YearData {
  const generated = dueReceipts(year, today);
  if (!generated.length) return year;

  // lastPosted je Kostenstelle auf das letzte erzeugte Datum setzen
  const lastByName = new Map<string, string>();
  for (const r of generated) {
    const name = r.vendor.replace(' (wiederkehrend)', '');
    const prev = lastByName.get(name);
    if (!prev || r.date > prev) lastByName.set(name, r.date);
  }
  const recurring: RecurringCost[] = year.recurring.map((rc) =>
    lastByName.has(rc.name) ? { ...rc, lastPosted: lastByName.get(rc.name) } : rc,
  );

  return { ...year, receipts: [...generated, ...year.receipts], recurring };
}
