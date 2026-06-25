import { Search, ScanLine, Menu, Briefcase, User, Share2 } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useUi } from '../state/UiContext';
import { NotificationsBell } from './NotificationsBell';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export function Header() {
  const { state, year, setActiveYear } = useApp();
  const { openReceiptModal, openMenu } = useUi();
  const firstName = state.profile.name.split(' ')[0];
  const sortedYears = [...state.years].sort((a, b) => b.year - a.year);
  const isBusiness = year.mode === 'unternehmer';

  const share = async () => {
    const data = {
      title: 'SteuerPilot AI',
      text: 'Mein Steuer-Cockpit mit KI-Assistent',
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        alert('Link in die Zwischenablage kopiert.');
      }
    } catch {
      /* Nutzer hat abgebrochen */
    }
  };

  return (
    <header className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={openMenu}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface shadow-[var(--shadow-card)] lg:hidden"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {greeting()}, {firstName}! <span className="align-middle">👋</span>
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-ink-soft">Steuer-Cockpit</span>
            <select
              value={year.id}
              onChange={(e) => setActiveYear(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-sm font-semibold text-brand-700 outline-none focus:border-brand"
              aria-label="Steuerjahr wählen"
            >
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </select>
            <span
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-semibold ${
                isBusiness ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
              }`}
            >
              {isBusiness ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {isBusiness ? 'Unternehmer' : 'Angestellt'}
            </span>
          </div>
        </div>
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
          onClick={share}
          className="grid h-11 w-11 place-items-center rounded-xl bg-surface shadow-[var(--shadow-card)]"
          aria-label="Teilen"
          title="Teilen"
        >
          <Share2 className="h-5 w-5 text-ink-soft" />
        </button>

        <NotificationsBell />

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
