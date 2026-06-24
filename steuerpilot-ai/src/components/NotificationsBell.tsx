import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, ListChecks, CheckCircle2 } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { deadlineViews } from '../lib/calculations';

const SOON_DAYS = 30;

export function NotificationsBell() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const deadlines = deadlineViews(state.deadlines).filter(
    (d) => d.status !== 'erledigt' && (d.overdue || d.daysLeft <= SOON_DAYS),
  );
  const openTasks = state.checklist.filter((c) => !c.done);
  const count = deadlines.length + (openTasks.length > 0 ? 1 : 0);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-xl bg-surface shadow-[var(--shadow-card)]"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-5 w-5 text-ink-soft" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.62rem] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-line">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-ink">Benachrichtigungen</p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {deadlines.length === 0 && openTasks.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <p className="text-sm text-ink-soft">Alles erledigt — keine offenen Hinweise.</p>
                </div>
              )}

              {deadlines.map((d) => (
                <button
                  key={d.id}
                  onClick={() => go('/fristen')}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50/40"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${d.overdue ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand'}`}>
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.85rem] font-semibold text-ink">{d.title}</span>
                    <span className={`block text-[0.72rem] ${d.overdue ? 'text-danger' : 'text-ink-soft'}`}>
                      {d.overdue ? 'Überfällig' : `Fällig in ${d.daysLeft} Tagen`} ·{' '}
                      {new Date(d.dueDate + 'T00:00:00').toLocaleDateString('de-DE')}
                    </span>
                  </span>
                </button>
              ))}

              {openTasks.length > 0 && (
                <button
                  onClick={() => go('/checkliste')}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50/40"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-semibold text-ink">
                      {openTasks.length} offene{openTasks.length === 1 ? 'r Schritt' : ' Schritte'} in der Checkliste
                    </span>
                    <span className="block text-[0.72rem] text-ink-soft">Jetzt erledigen</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
