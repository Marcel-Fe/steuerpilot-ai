import { Check } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { taxProgress } from '../lib/calculations';

export function Checkliste() {
  const { state, toggleChecklist } = useApp();
  const progress = taxProgress(state.checklist);

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

      <Card className="divide-y divide-line">
        {state.checklist.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleChecklist(item.id)}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-brand-50/30"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                item.done ? 'border-success bg-success text-white' : 'border-line'
              }`}
            >
              {item.done && <Check className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[0.9rem] font-semibold ${item.done ? 'text-ink-soft line-through' : 'text-ink'}`}>
                {item.title}
              </span>
              <span className="block text-[0.74rem] text-ink-soft">{item.subtitle}</span>
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}
