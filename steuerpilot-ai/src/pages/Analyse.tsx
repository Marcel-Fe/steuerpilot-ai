import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import {
  expensesByMonth,
  expensesByCategory,
  totalExpenses,
  estimatedPotential,
  formatEuro,
} from '../lib/calculations';

const TIPS = [
  'Arbeitsmittel wie Laptop, Monitor oder Bürostuhl sind als Werbungskosten absetzbar — Belege sammeln.',
  'Für Homeoffice gibt es die Tagespauschale (6 €/Tag, gedeckelt) — auch ohne separates Arbeitszimmer.',
  'Fahrten zur Arbeit zählen über die Entfernungspauschale — pro Entfernungskilometer.',
  'Fortbildungen, Fachbücher und Seminare, die deinem Beruf dienen, sind absetzbar.',
];

export function Analyse() {
  const { year } = useApp();
  const months = expensesByMonth(year.receipts);
  const categories = expensesByCategory(year.receipts);
  const total = totalExpenses(year.receipts);
  const potential = estimatedPotential(year.receipts);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">Steuer-Analyse</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Erfasste Ausgaben</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{formatEuro(total)} €</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Mögliches Potenzial</p>
          <p className="mt-1 text-2xl font-extrabold text-brand">{formatEuro(potential)} €</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Belege</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{year.receipts.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <TrendingUp className="h-5 w-5 text-brand" /> Ausgaben im Jahresverlauf
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6b7280" />
              <Tooltip
                cursor={{ fill: '#eef0ff' }}
                formatter={(v) => [`${formatEuro(Number(v))} €`, 'Ausgaben']}
                contentStyle={{ borderRadius: 12, border: '1px solid #eceef3', fontSize: 13 }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {months.map((m) => (
                  <Cell key={m.month} fill="#6366f1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Aufschlüsselung nach Kategorie</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {categories.map((c) => (
            <li key={c.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="font-bold text-ink">{formatEuro(c.amount)} €</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full" style={{ width: `${(c.amount / total) * 100}%`, background: c.color }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Lightbulb className="h-5 w-5 text-warn" /> Optimierungs-Tipps
        </h2>
        <ul className="mt-3 space-y-2.5">
          {TIPS.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[0.88rem] text-ink-soft">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.74rem] text-ink-soft">
          Allgemeine Hinweise, keine verbindliche Steuerberatung.
        </p>
      </Card>
    </div>
  );
}
