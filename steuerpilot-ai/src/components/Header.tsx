import { Search, Bell, ScanLine } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useUi } from '../state/UiContext';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export function Header() {
  const { state } = useApp();
  const { openReceiptModal } = useUi();
  const firstName = state.profile.name.split(' ')[0];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {greeting()}, {firstName}! <span className="align-middle">👋</span>
        </h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Dein Steuer-Cockpit für {state.profile.taxYear}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            placeholder="Suche überall…"
            className="w-56 rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>

        <button
          className="relative grid h-11 w-11 place-items-center rounded-xl bg-surface shadow-[var(--shadow-card)]"
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-5 w-5 text-ink-soft" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <button
          onClick={openReceiptModal}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02]"
        >
          <ScanLine className="h-4 w-4" />
          Beleg scannen
        </button>
      </div>
    </header>
  );
}
