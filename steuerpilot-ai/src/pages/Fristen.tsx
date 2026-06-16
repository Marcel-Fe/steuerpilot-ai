import { CalendarDays } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { deadlineViews } from '../lib/calculations';

export function Fristen() {
  const { state } = useApp();
  const deadlines = deadlineViews(state.deadlines);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">Fristen & Termine</h1>

      <Card className="divide-y divide-line">
        {deadlines.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-5 py-4">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                d.overdue ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-semibold text-ink">{d.title}</p>
              <p className="text-[0.74rem] text-ink-soft">
                {new Date(d.dueDate + 'T00:00:00').toLocaleDateString('de-DE')}
              </p>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-[0.7rem] font-semibold ${
                d.overdue ? 'bg-red-50 text-danger' : 'bg-emerald-50 text-success'
              }`}
            >
              {d.overdue ? 'Überfällig' : `In ${d.daysLeft} Tagen`}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
