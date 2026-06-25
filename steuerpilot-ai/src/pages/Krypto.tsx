import { useState } from 'react';
import { Bitcoin, Plus, Trash2, Info, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { formatEuro } from '../lib/calculations';
import { computeCrypto, FREIGRENZE_EUR } from '../lib/crypto';
import type { CryptoKind } from '../types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const INFO = [
  {
    title: '1 Jahr halten = steuerfrei',
    text: 'Werden Kryptowerte länger als ein Jahr gehalten, ist der Gewinn beim Verkauf in der Regel komplett steuerfrei (privates Veräußerungsgeschäft, § 23 EStG).',
  },
  {
    title: 'Freigrenze 1.000 € pro Jahr',
    text: 'Liegen alle steuerpflichtigen privaten Veräußerungsgewinne eines Jahres unter 1.000 €, bleiben sie steuerfrei. Wird die Grenze überschritten, ist der gesamte Gewinn steuerpflichtig (Freigrenze, kein Freibetrag).',
  },
  {
    title: 'Verkauf < 1 Jahr = steuerpflichtig',
    text: 'Innerhalb der einjährigen Haltefrist verkauft, wird der Gewinn mit deinem persönlichen Einkommensteuersatz versteuert. FIFO (first in, first out) ist die übliche Zuordnung.',
  },
  {
    title: 'Verluste verrechenbar',
    text: 'Verluste aus Krypto kannst du mit Gewinnen aus anderen privaten Veräußerungsgeschäften verrechnen (auch ins Vor-/Folgejahr vortragbar).',
  },
  {
    title: 'Staking, Lending & Co.',
    text: 'Erträge aus Staking/Lending gelten als sonstige Einkünfte und werden gesondert behandelt. Hier lohnt sich Rücksprache mit dem Steuerberater.',
  },
];

export function Krypto() {
  const { year, addCrypto, deleteCrypto } = useApp();
  const result = computeCrypto(year.crypto);

  const [asset, setAsset] = useState('BTC');
  const [kind, setKind] = useState<CryptoKind>('kauf');
  const [date, setDate] = useState(todayIso());
  const [quantity, setQuantity] = useState('');
  const [totalEur, setTotalEur] = useState('');
  const [error, setError] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantity.replace(',', '.'));
    const t = parseFloat(totalEur.replace(',', '.'));
    if (!asset.trim()) return setError('Bitte ein Asset angeben (z.B. BTC).');
    if (!q || q <= 0) return setError('Bitte eine gültige Menge angeben.');
    if (!t || t <= 0) return setError('Bitte einen gültigen Betrag angeben.');
    addCrypto({ asset: asset.trim().toUpperCase(), kind, date, quantity: q, totalEur: t });
    setQuantity('');
    setTotalEur('');
    setError('');
  };

  const txs = [...year.crypto].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <Bitcoin className="h-6 w-6 text-warn" /> Krypto-Steuer
      </h1>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Steuerpflichtiger Gewinn ({new Date().getFullYear()})</p>
          <p className={`mt-1 text-2xl font-extrabold ${result.taxableGains > 0 ? 'text-ink' : 'text-success'}`}>
            {formatEuro(result.taxableGains)} €
          </p>
          <p className={`mt-1 text-[0.74rem] font-semibold ${result.overFreigrenze ? 'text-danger' : 'text-success'}`}>
            {result.overFreigrenze
              ? `Über Freigrenze (${formatEuro(FREIGRENZE_EUR)} €) – steuerpflichtig`
              : `Unter Freigrenze (${formatEuro(FREIGRENZE_EUR)} €) – aktuell steuerfrei`}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Steuerfreie Gewinne (&gt; 1 Jahr)</p>
          <p className="mt-1 text-2xl font-extrabold text-success">{formatEuro(result.taxFreeGains)} €</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">Aktuelle Bestände</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{result.holdings.length}</p>
          <p className="mt-1 text-[0.74rem] text-ink-soft">
            {result.holdings.map((h) => `${h.quantity} ${h.asset}`).join(', ') || '—'}
          </p>
        </Card>
      </div>

      {/* Erfassung */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Transaktion erfassen</h2>
        <form onSubmit={add} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="BTC" className={inputCls + ' sm:col-span-1'} />
          <select value={kind} onChange={(e) => setKind(e.target.value as CryptoKind)} className={inputCls + ' sm:col-span-1'}>
            <option value="kauf">Kauf</option>
            <option value="verkauf">Verkauf</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' sm:col-span-2'} />
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" placeholder="Menge" className={inputCls + ' sm:col-span-1'} />
          <input value={totalEur} onChange={(e) => setTotalEur(e.target.value)} inputMode="decimal" placeholder="€ gesamt" className={inputCls + ' sm:col-span-1'} />
          <button type="submit" className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white sm:col-span-6">
            <Plus className="h-4 w-4" /> Hinzufügen
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {/* Liste */}
      <Card className="divide-y divide-line">
        {txs.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${t.kind === 'kauf' ? 'bg-brand-50 text-brand' : 'bg-emerald-50 text-success'}`}>
              {t.asset.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-semibold text-ink">
                {t.kind === 'kauf' ? 'Kauf' : 'Verkauf'} · {t.quantity} {t.asset}
              </p>
              <p className="text-[0.74rem] text-ink-soft">{new Date(t.date + 'T00:00:00').toLocaleDateString('de-DE')}</p>
            </div>
            <span className="w-24 text-right text-[0.9rem] font-bold text-ink">{formatEuro(t.totalEur, true)} €</span>
            <button onClick={() => deleteCrypto(t.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger" aria-label="Löschen">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {txs.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-soft">Noch keine Krypto-Transaktionen erfasst.</p>}
      </Card>

      {/* Realisierte Gewinne */}
      {result.gains.length > 0 && (
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <TrendingUp className="h-5 w-5 text-brand" /> Realisierte Gewinne/Verluste
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {result.gains.map((g, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-[0.86rem]">
                <span className="text-ink-soft">
                  {g.asset} · {new Date(g.date + 'T00:00:00').toLocaleDateString('de-DE')}
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[0.64rem] font-semibold ${g.taxable ? 'bg-red-50 text-danger' : 'bg-emerald-50 text-success'}`}>
                    {g.taxable ? 'steuerpflichtig' : 'steuerfrei (>1 J.)'}
                  </span>
                </span>
                <span className={`font-bold ${g.gain >= 0 ? 'text-ink' : 'text-danger'}`}>
                  {g.gain >= 0 ? '+' : ''}{formatEuro(g.gain, true)} €
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Steuer-Infos */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Info className="h-5 w-5 text-brand" /> Krypto & Steuern in Deutschland
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {INFO.map((i) => (
            <div key={i.title} className="rounded-xl bg-bg p-4">
              <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-success" /> {i.title}
              </p>
              <p className="mt-1 text-[0.82rem] leading-snug text-ink-soft">{i.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.74rem] text-ink-soft">
          Vereinfachte FIFO-Schätzung, Stand der Regeln 2024/2025 — keine verbindliche Steuerberatung.
          Bei größeren Beträgen oder Staking/Lending bitte einen Steuerberater hinzuziehen.
        </p>
      </Card>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-surface';
