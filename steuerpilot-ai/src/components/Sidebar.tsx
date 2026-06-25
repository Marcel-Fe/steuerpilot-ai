import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  ReceiptText,
  ListChecks,
  Wallet,
  BarChart3,
  Bitcoin,
  Briefcase,
  FileSpreadsheet,
  CalendarClock,
  FileText,
  Mail,
  Settings,
  Sparkles,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assistent', label: 'KI Assistent', icon: Bot },
  { to: '/belege', label: 'Belege', icon: ReceiptText },
  { to: '/checkliste', label: 'Steuer-Checkliste', icon: ListChecks },
  { to: '/ausgaben', label: 'Ausgaben', icon: Wallet },
  { to: '/analyse', label: 'Steuer-Analyse', icon: BarChart3 },
  { to: '/krypto', label: 'Krypto', icon: Bitcoin },
  { to: '/unternehmer', label: 'Unternehmer', icon: Briefcase },
  { to: '/rechnungen', label: 'Rechnungen & Kosten', icon: FileSpreadsheet },
  { to: '/fristen', label: 'Fristen & Termine', icon: CalendarClock },
  { to: '/dokumente', label: 'Dokumente', icon: FileText },
  { to: '/steuerberater', label: 'Steuerberater', icon: Mail },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];

// Inhalt der Seitenleiste — geteilt von Desktop-Sidebar und mobilem Drawer.
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useApp();
  const { hasPin, lock } = useAuth();

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-indigo-700">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-[1.15rem] font-bold tracking-tight text-ink">
          SteuerPilot <span className="text-brand">AI</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-soft hover:bg-brand-50/60 hover:text-ink'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 shadow-[var(--shadow-card)]">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {state.profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.85rem] font-semibold text-ink">{state.profile.name}</p>
            <p className="text-[0.72rem] text-ink-soft">{state.profile.role}</p>
          </div>
          {hasPin ? (
            <button onClick={lock} className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand" aria-label="App sperren">
              <Lock className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-soft" />
          )}
        </div>
      </div>
    </div>
  );
}

// Feste Sidebar auf Desktop
export function Sidebar() {
  return (
    <aside className="no-print hidden w-[248px] shrink-0 px-5 py-6 lg:block">
      <SidebarContent />
    </aside>
  );
}
