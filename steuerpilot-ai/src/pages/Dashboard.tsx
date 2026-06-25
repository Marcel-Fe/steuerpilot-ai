import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChevronRight,
  Info,
  ReceiptText,
  CalendarDays,
  Wrench,
  Car,
  Home,
  Rocket,
  BookOpen,
} from 'lucide-react';
import { Card } from '../components/Card';
import { AiAssistantCard } from '../components/AiAssistantCard';
import { useApp } from '../state/AppContext';
import { useUi } from '../state/UiContext';
import {
  taxProgress,
  expensesByCategory,
  totalExpenses,
  estimatedPotential,
  deadlineViews,
  formatEuro,
} from '../lib/calculations';

const POTENTIAL_TREND = [
  { v: 320 }, { v: 480 }, { v: 450 }, { v: 700 }, { v: 880 }, { v: 1240 },
];

const STEP_ICONS = [Wrench, Car, Home, ReceiptText, BookOpen];

export function Dashboard() {
  const { year, toggleChecklist } = useApp();
  const { openReceiptModal } = useUi();

  const progress = taxProgress(year.checklist);
  const potential = estimatedPotential(year.receipts);
  const categories = expensesByCategory(year.receipts);
  const total = totalExpenses(year.receipts);
  const deadlines = deadlineViews(year.deadlines);
  const openSteps = year.checklist.filter((c) => !c.done).slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
      {/* Hauptspalte */}
      <div className="flex flex-col gap-5">
        {/* Fortschritt + Potenzial */}
        <Card className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              Dein Steuerfortschritt <Info className="h-3.5 w-3.5" />
            </p>
            <p className="mt-2 text-4xl font-extrabold text-brand">{progress}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-teal transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[0.82rem] text-ink-soft">
              {progress >= 70 ? 'Sehr gut! Du bist auf einem guten Weg.' : 'Weiter so — fast geschafft.'}
            </p>
          </div>

          <div className="relative sm:border-l sm:border-line sm:pl-6">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              Mögliches Steuerpotenzial <Info className="h-3.5 w-3.5" />
            </p>
            <p className="mt-2 text-4xl font-extrabold text-brand">
              {formatEuro(potential)} €
            </p>
            <p className="mt-2 text-[0.82rem] text-ink-soft">
              Auf Basis deiner bisherigen Angaben.
            </p>
            <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-32 opacity-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={POTENTIAL_TREND}>
                  <defs>
                    <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#pot)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KI-Assistent + Belege */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AiAssistantCard />

          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <h2 className="text-base font-bold text-ink">Belege</h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50">
                  <ReceiptText className="h-7 w-7 text-brand" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-ink">
                    {year.receipts.length}
                  </p>
                  <p className="text-[0.82rem] text-ink-soft">Belege gespeichert</p>
                </div>
              </div>
              <button
                onClick={openReceiptModal}
                className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700"
              >
                <ReceiptText className="h-4 w-4" /> Belege scannen
              </button>
            </Card>

            {/* Ausgaben nach Kategorien */}
            <Card className="p-5">
              <h2 className="text-base font-bold text-ink">Ausgaben nach Kategorien</h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="amount"
                        nameKey="label"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {categories.map((c) => (
                          <Cell key={c.category} fill={c.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <p className="text-[0.62rem] text-ink-soft">Gesamt</p>
                      <p className="text-sm font-bold text-ink">{formatEuro(total)} €</p>
                    </div>
                  </div>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {categories.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-[0.84rem]">
                      <span className="flex items-center gap-2 text-ink-soft">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                        {c.label}
                      </span>
                      <span className="font-semibold text-ink">{formatEuro(c.amount)} €</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/ausgaben"
                className="mt-4 block rounded-xl bg-brand-50 py-2 text-center text-sm font-semibold text-brand-700"
              >
                Alle Ausgaben anzeigen
              </Link>
            </Card>
          </div>
        </div>

        {/* Promo-Banner */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-ink-900 to-brand-700 p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-lg font-bold">🚀 Lass uns dein Steuerpotenzial maximieren!</p>
              <p className="mt-1 text-sm text-white/80">
                Du hast in {openSteps.length} Bereichen noch Optimierungspotenzial.
              </p>
              <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700">
                Jetzt prüfen
              </button>
            </div>
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white/30">
              <div className="text-center">
                <Rocket className="mx-auto h-5 w-5" />
                <p className="text-lg font-extrabold">+18%</p>
                <p className="text-[0.6rem] text-white/70">mehr Potenzial</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Rechte Spalte */}
      <div className="flex flex-col gap-5">
        {/* Nächste Schritte */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Nächste Schritte</h2>
          <ul className="mt-3 space-y-2">
            {openSteps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <li key={step.id}>
                  <button
                    onClick={() => toggleChecklist(step.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line p-2.5 text-left transition-colors hover:border-brand hover:bg-brand-50/40"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.85rem] font-semibold text-ink">
                        {step.title}
                      </span>
                      <span className="block truncate text-[0.74rem] text-ink-soft">
                        {step.subtitle}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-ink-soft" />
                  </button>
                </li>
              );
            })}
            {openSteps.length === 0 && (
              <li className="rounded-xl bg-brand-50/50 p-3 text-sm text-ink-soft">
                Alle Schritte erledigt — stark! 🎉
              </li>
            )}
          </ul>
          <Link
            to="/checkliste"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
          >
            Zur Steuer-Checkliste <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>

        {/* Wichtige Fristen */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Wichtige Fristen</h2>
          <ul className="mt-3 space-y-3">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    d.overdue ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[0.85rem] font-semibold ${d.overdue ? 'text-danger' : 'text-ink'}`}>
                    {new Date(d.dueDate + 'T00:00:00').toLocaleDateString('de-DE')}
                  </p>
                  <p className="truncate text-[0.74rem] text-ink-soft">{d.title}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-[0.66rem] font-semibold ${
                    d.overdue
                      ? 'bg-red-50 text-danger'
                      : 'bg-emerald-50 text-success'
                  }`}
                >
                  {d.overdue ? 'Überfällig' : `In ${d.daysLeft} Tagen`}
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/fristen"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
          >
            Alle Fristen anzeigen <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>

        {/* Steuer-Wissen */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Steuer-Wissen</h2>
          <p className="mt-2 text-[0.78rem] text-ink-soft">Neuer Artikel für dich</p>
          <p className="mt-1 text-[0.92rem] font-semibold text-ink">
            Homeoffice richtig absetzen – So geht's {year.year}
          </p>
          <div className="mt-3 grid h-24 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50">
            <Home className="h-8 w-8 text-brand" />
          </div>
          <a className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-brand-700">
            Zum Artikel <ChevronRight className="h-4 w-4" />
          </a>
        </Card>
      </div>
    </div>
  );
}
