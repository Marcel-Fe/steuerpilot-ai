import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { taxProgress } from '../lib/calculations';

export function Checkliste() {
  const { state, toggleChecklist, addChecklistItem, deleteChecklistItem } = useApp();
  const [title, setTitle] = useState('');
  const progress = taxProgress(state.checklist);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addChecklistItem(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">Steuer-Checkliste</h1>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-soft">Fortschritt</p>
          <p className="text-sm font-bold text-brand">{progress}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-50">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-teal" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Neue Aufgabe hinzufügen…"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Hinzufügen
        </button>
      </form>

      <Card className="divide-y divide-line">
        {state.checklist.map((item) => (
          <div key={item.id} className="group flex items-center gap-3 px-5 py-3.5">
            <button
              onClick={() => toggleChecklist(item.id)}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                item.done ? 'border-success bg-success text-white' : 'border-line hover:border-brand'
              }`}
              aria-label="Umschalten"
            >
              {item.done && <Check className="h-4 w-4" />}
            </button>
            <button onClick={() => toggleChecklist(item.id)} className="min-w-0 flex-1 text-left">
              <span className={`block text-[0.9rem] font-semibold ${item.done ? 'text-ink-soft line-through' : 'text-ink'}`}>
                {item.title}
              </span>
              {item.subtitle && <span className="block text-[0.74rem] text-ink-soft">{item.subtitle}</span>}
            </button>
            <button
              onClick={() => deleteChecklistItem(item.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger"
              aria-label="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {state.checklist.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">Keine Aufgaben — füge deine erste hinzu.</p>
        )}
      </Card>
    </div>
  );
}
