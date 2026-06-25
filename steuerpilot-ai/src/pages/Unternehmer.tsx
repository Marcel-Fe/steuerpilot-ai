import { useState } from 'react';
import { Briefcase, Plus, Trash2, Info, TrendingUp, FileCheck2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { totalExpenses, totalIncome, formatEuro } from '../lib/calculations';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const DUTIES = [
  {
    title: 'Rechnungen richtig stellen (§ 14 UStG)',
    text: 'Pflichtangaben: vollständiger Name & Anschrift von dir und Kunde, Steuernummer/USt-IdNr., Rechnungsdatum, fortlaufende Rechnungsnummer, Leistungsbeschreibung, Netto-Betrag, Steuersatz & Steuerbetrag (oder Hinweis auf § 19).',
  },
  {
    title: 'Einnahmen-Überschuss-Rechnung (Anlage EÜR)',
    text: 'Als Selbstständiger ermittelst du den Gewinn meist per EÜR: Betriebseinnahmen minus Betriebsausgaben. Beides muss vollständig belegt sein.',
  },
  {
    title: 'Umsatzsteuer-Voranmeldung',
    text: 'Wer USt ausweist, meldet sie (monatlich/quartalsweise) per ELSTER an und führt sie ab. Kleinunternehmer (§ 19) sind davon befreit.',
  },
  {
    title: 'Kleinunternehmerregelung (§ 19 UStG)',
    text: 'Unter den Umsatzgrenzen (aktuell 25.000 € Vorjahr / 100.000 € laufendes Jahr) kannst du ohne Umsatzsteuer fakturieren — einfacher, aber kein Vorsteuerabzug.',
  },
  {
    title: 'Aufbewahrungspflicht',
    text: 'Rechnungen, Belege und Geschäftsunterlagen müssen i.d.R. 10 Jahre aufbewahrt werden (GoBD, digital revisionssicher).',
  },
  {
    title: 'Was du belegen musst',
    text: 'Jede Betriebsausgabe (Wareneinkauf, Büro, Reise, Marketing, Miete, Versicherungen) und jede Einnahme braucht einen Beleg/Rechnung. Bewirtung & Fahrten zusätzlich mit Anlass dokumentieren.',
  },
];

export function Unternehmer() {
  const { year, setYearMode, addIncome, deleteIncome } = useApp();
  const isBusiness = year.mode === 'unternehmer';

  const [date, setDate] = useState(todayIso());
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const income = totalIncome(year.income);
  const expenses = totalExpenses(year.receipts);
  const profit = income - expenses;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount.replace(',', '.'));
    if (!client.trim()) return setError('Bitte Kunde/Quelle angeben.');
    if (!a || a <= 0) return setError('Bitte gültigen Betrag angeben.');
    addIncome({ date, client: client.trim(), amount: a });
    setClient('');
    setAmount('');
    setError('');
  };

  const inc = [...year.income].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <Briefcase className="h-6 w-6 text-amber-600" /> Unternehmer-Modus
      </h1>

      {!isBusiness && (
        <Card className="flex flex-col items-start gap-3 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Dieses Steuerjahr ist im <strong>Angestellt-Modus</strong>. Schalte auf Unternehmer um, um
            Einnahmen, Gewinn (EÜR) und Betriebsausgaben zu nutzen.
          </p>
          <button
            onClick={() => setYearMode('unternehmer')}
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Auf Unternehmer umstellen
          </button>
        </Card>
      )}

      {/* EÜR-Kennzahlen */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Betriebseinnahmen</p>
          <p className="mt-1 text-2xl font-extrabold text-success">{formatEuro(income, true)} €</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Betriebsausgaben</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{formatEuro(expenses, true)} €</p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-1 text-sm text-ink-soft">
            <TrendingUp className="h-4 w-4" /> Gewinn (EÜR)
          </p>
          <p className={`mt-1 text-2xl font-extrabold ${profit >= 0 ? 'text-brand' : 'text-danger'}`}>
            {formatEuro(profit, true)} €
          </p>
        </Card>
      </div>

      {/* Einnahmen erfassen */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Einnahme erfassen</h2>
        <form onSubmit={add} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' col-span-2 sm:col-span-1'} />
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Kunde / Quelle" className={inputCls + ' col-span-2'} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="€ Betrag" className={inputCls} />
          <button type="submit" className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white sm:col-span-4">
            <Plus className="h-4 w-4" /> Einnahme hinzufügen
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {inc.length > 0 && (
        <Card className="divide-y divide-line">
          {inc.map((i) => (
            <div key={i.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-success">€</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9rem] font-semibold text-ink">{i.client}</p>
                <p className="text-[0.74rem] text-ink-soft">{new Date(i.date + 'T00:00:00').toLocaleDateString('de-DE')}</p>
              </div>
              <span className="w-24 text-right text-[0.9rem] font-bold text-success">{formatEuro(i.amount, true)} €</span>
              <button onClick={() => deleteIncome(i.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger" aria-label="Löschen">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* Pflichten / Infohub */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Info className="h-5 w-5 text-brand" /> Was du als Unternehmer wissen & belegen musst
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DUTIES.map((d) => (
            <div key={d.title} className="rounded-xl bg-bg p-4">
              <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink">
                <FileCheck2 className="h-4 w-4 text-success" /> {d.title}
              </p>
              <p className="mt-1 text-[0.82rem] leading-snug text-ink-soft">{d.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.74rem] text-ink-soft">
          Allgemeine Orientierung (Stand 2024/2025), keine verbindliche Steuerberatung. Für die
          Gründung und laufende Pflichten bitte Steuerberater bzw. Finanzamt einbeziehen.
        </p>
      </Card>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-surface';
