import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { expensesByCategory, totalExpenses, formatEuro } from '../lib/calculations';

export function Ausgaben() {
  const { state } = useApp();
  const categories = expensesByCategory(state.receipts);
  const total = totalExpenses(state.receipts);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">Ausgaben nach Kategorien</h1>

      <Card className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[220px_1fr]">
        <div className="relative h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="label"
                innerRadius={60}
                outerRadius={88}
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
              <p className="text-xs text-ink-soft">Gesamt</p>
              <p className="text-lg font-bold text-ink">{formatEuro(total)} €</p>
            </div>
          </div>
        </div>

        <ul className="flex flex-col justify-center gap-3">
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
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(c.amount / total) * 100}%`, background: c.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
