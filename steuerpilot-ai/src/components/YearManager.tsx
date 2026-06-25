import { useState } from 'react';
import { CalendarRange, Plus, Trash2, Check, Briefcase, User } from 'lucide-react';
import { Card } from './Card';
import { useApp } from '../state/AppContext';
import type { TaxMode } from '../types';

export function YearManager() {
  const { state, year, addYear, deleteYear, setActiveYear, setYearMode } = useApp();
  const [newYear, setNewYear] = useState(String(new Date().getFullYear() - 1));
  const [newMode, setNewMode] = useState<TaxMode>('angestellt');

  const years = [...state.years].sort((a, b) => b.year - a.year);

  const add = () => {
    const y = parseInt(newYear, 10);
    if (y >= 2000 && y <= 2100) addYear(y, newMode);
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        <CalendarRange className="h-5 w-5 text-brand" /> Steuerjahre
      </h2>
      <p className="mt-1 text-[0.84rem] text-ink-soft">
        Lege für jedes Jahr eine eigene Erklärung an — auch rückwirkend. Jedes Jahr hat eigene Belege,
        Einnahmen, Fristen und einen Modus (Angestellt oder Unternehmer).
      </p>

      <ul className="mt-4 divide-y divide-line">
        {years.map((y) => {
          const active = y.id === state.activeYearId;
          return (
            <li key={y.id} className="flex items-center gap-3 py-2.5">
              <button
                onClick={() => setActiveYear(y.id)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                  active ? 'bg-brand text-white' : 'bg-brand-50 text-brand'
                }`}
                aria-label="Jahr aktivieren"
              >
                {active ? <Check className="h-4 w-4" /> : y.year.toString().slice(2)}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9rem] font-semibold text-ink">Steuerjahr {y.year}</p>
                <p className="flex items-center gap-1 text-[0.74rem] text-ink-soft">
                  {y.mode === 'unternehmer' ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {y.mode === 'unternehmer' ? 'Unternehmer' : 'Angestellt'} · {y.receipts.length} Belege
                </p>
              </div>
              {active && (
                <button
                  onClick={() => setYearMode(y.mode === 'unternehmer' ? 'angestellt' : 'unternehmer')}
                  className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-[0.72rem] font-semibold text-brand-700"
                >
                  → {y.mode === 'unternehmer' ? 'Angestellt' : 'Unternehmer'}
                </button>
              )}
              {state.years.length > 1 && (
                <button
                  onClick={() => deleteYear(y.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger"
                  aria-label="Jahr löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
        <input
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          inputMode="numeric"
          placeholder="Jahr (z.B. 2024)"
          className="rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface sm:w-36"
        />
        <select
          value={newMode}
          onChange={(e) => setNewMode(e.target.value as TaxMode)}
          className="rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface"
        >
          <option value="angestellt">Angestellt</option>
          <option value="unternehmer">Unternehmer</option>
        </select>
        <button onClick={add} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Jahr anlegen
        </button>
      </div>
      <p className="mt-2 text-[0.74rem] text-ink-soft">Aktuell aktiv: Steuerjahr {year.year}</p>
    </Card>
  );
}
