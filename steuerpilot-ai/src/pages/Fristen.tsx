import { useState } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { deadlineViews } from '../lib/calculations';
import type { Deadline } from '../types';
import { uid } from '../storage/store';

function blank(): Deadline {
  return { id: uid(), title: '', dueDate: new Date().toISOString().slice(0, 10), status: 'offen' };
}

export function Fristen() {
  const { state, upsertDeadline, deleteDeadline } = useApp();
  const [editing, setEditing] = useState<Deadline | null>(null);
  const deadlines = deadlineViews(state.deadlines);

  const save = () => {
    if (editing && editing.title.trim()) {
      upsertDeadline({ ...editing, title: editing.title.trim() });
      setEditing(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Fristen & Termine</h1>
        <button
          onClick={() => setEditing(blank())}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Frist hinzufügen
        </button>
      </div>

      <Card className="divide-y divide-line">
        {deadlines.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-5 py-4">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                d.status === 'erledigt'
                  ? 'bg-emerald-50 text-success'
                  : d.overdue
                    ? 'bg-red-50 text-danger'
                    : 'bg-brand-50 text-brand'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[0.9rem] font-semibold ${d.status === 'erledigt' ? 'text-ink-soft line-through' : 'text-ink'}`}>
                {d.title}
              </p>
              <p className="text-[0.74rem] text-ink-soft">
                {new Date(d.dueDate + 'T00:00:00').toLocaleDateString('de-DE')}
              </p>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-[0.7rem] font-semibold ${
                d.status === 'erledigt'
                  ? 'bg-emerald-50 text-success'
                  : d.overdue
                    ? 'bg-red-50 text-danger'
                    : 'bg-emerald-50 text-success'
              }`}
            >
              {d.status === 'erledigt' ? 'Erledigt' : d.overdue ? 'Überfällig' : `In ${d.daysLeft} Tagen`}
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => upsertDeadline({ ...d, status: d.status === 'erledigt' ? 'offen' : 'erledigt' })}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-emerald-50 hover:text-success"
                aria-label="Als erledigt markieren"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditing({ id: d.id, title: d.title, dueDate: d.dueDate, status: d.status })}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand"
                aria-label="Bearbeiten"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteDeadline(d.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger"
                aria-label="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {deadlines.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">Keine Fristen — füge deine erste hinzu.</p>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Frist</h2>
              <button onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.78rem] font-medium text-ink-soft">Titel</span>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="z.B. Abgabe Steuererklärung"
                  className="w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.78rem] font-medium text-ink-soft">Datum</span>
                <input
                  type="date"
                  value={editing.dueDate}
                  onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-brand-50">
                  Abbrechen
                </button>
                <button onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
