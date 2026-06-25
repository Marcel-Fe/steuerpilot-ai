import { useState } from 'react';
import { FileText, Plus, Trash2, Printer, Repeat, Zap, X } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { categoriesForMode, CATEGORY_LABELS } from '../types';
import type { Invoice, InvoiceItem, RecurringInterval, ExpenseCategory } from '../types';
import { formatEuro } from '../lib/calculations';
import { dueReceipts } from '../lib/recurring';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nextInvoiceNumber(invoices: Invoice[], year: number): string {
  const prefix = `RE-${year}-`;
  const nums = invoices
    .filter((i) => i.number.startsWith(prefix))
    .map((i) => parseInt(i.number.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

const invoiceNet = (items: InvoiceItem[]) =>
  Math.round(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0) * 100) / 100;

export function Rechnungen() {
  const {
    state, year, addInvoice, deleteInvoice, toggleInvoicePaid, addIncome, postDueRecurring,
  } = useApp();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const due = dueReceipts(year).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Rechnungen & Kosten</h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Rechnung erstellen
        </button>
      </div>

      {/* Rechnungen-Liste */}
      <Card className="divide-y divide-line">
        <div className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-ink">
          <FileText className="h-4 w-4 text-brand" /> Ausgangsrechnungen
        </div>
        {year.invoices.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-ink-soft">Noch keine Rechnungen erstellt.</p>
        )}
        {year.invoices.map((inv) => {
          const net = invoiceNet(inv.items);
          const gross = Math.round(net * (1 + inv.taxRate / 100) * 100) / 100;
          return (
            <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${inv.paid ? 'bg-emerald-50 text-success' : 'bg-brand-50 text-brand'}`}>
                {inv.number.slice(-3)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9rem] font-semibold text-ink">{inv.client}</p>
                <p className="text-[0.74rem] text-ink-soft">
                  {inv.number} · {new Date(inv.date + 'T00:00:00').toLocaleDateString('de-DE')}
                </p>
              </div>
              <span className="w-24 text-right text-[0.9rem] font-bold text-ink">{formatEuro(gross, true)} €</span>
              <button onClick={() => toggleInvoicePaid(inv.id)} className={`rounded-md px-2 py-1 text-[0.66rem] font-semibold ${inv.paid ? 'bg-emerald-50 text-success' : 'bg-amber-50 text-amber-700'}`}>
                {inv.paid ? 'Bezahlt' : 'Offen'}
              </button>
              <button onClick={() => setViewing(inv)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand" aria-label="Ansehen/Drucken">
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={() => addIncome({ date: inv.date, client: inv.client, amount: gross, note: inv.number })}
                className="hidden rounded-lg bg-brand-50 px-2.5 py-1.5 text-[0.7rem] font-semibold text-brand-700 sm:block"
                title="Als Einnahme buchen"
              >
                + Einnahme
              </button>
              <button onClick={() => deleteInvoice(inv.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger" aria-label="Löschen">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </Card>

      {/* Wiederkehrende Kosten */}
      <RecurringSection />

      {/* Automatik-Hinweis */}
      {due > 0 && (
        <Card className="flex flex-col items-start gap-3 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-brand-900">
            <Zap className="h-4 w-4" /> {due} fällige wiederkehrende {due === 1 ? 'Buchung' : 'Buchungen'} bereit.
          </p>
          <button onClick={postDueRecurring} className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            Jetzt automatisch als Belege buchen
          </button>
        </Card>
      )}

      {creating && (
        <InvoiceForm
          defaultNumber={nextInvoiceNumber(year.invoices, year.year)}
          onClose={() => setCreating(false)}
          onSave={(inv) => { addInvoice(inv); setCreating(false); }}
        />
      )}
      {viewing && <InvoicePrint invoice={viewing} sender={state.profile.name} onClose={() => setViewing(null)} />}
    </div>
  );
}

// --- Wiederkehrende Kosten Sektion ---
function RecurringSection() {
  const { year, addRecurring, deleteRecurring } = useApp();
  const cats = categoriesForMode(year.mode);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(cats[0]);
  const [amount, setAmount] = useState('');
  const [interval, setInterval] = useState<RecurringInterval>('monatlich');
  const [startDate, setStartDate] = useState(`${year.year}-01-01`);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount.replace(',', '.'));
    if (name.trim() && a > 0) {
      addRecurring({ name: name.trim(), category, amount: a, interval, startDate });
      setName('');
      setAmount('');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        <Repeat className="h-5 w-5 text-brand" /> Wiederkehrende Kosten (Automatik)
      </h2>
      <p className="mt-1 text-[0.84rem] text-ink-soft">
        Miete, Versicherungen, Abos & Co. einmal anlegen — die App bucht sie automatisch als Belege.
      </p>

      <ul className="mt-4 divide-y divide-line">
        {year.recurring.map((rc) => (
          <li key={rc.id} className="flex items-center gap-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
              <Repeat className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9rem] font-semibold text-ink">{rc.name}</p>
              <p className="text-[0.74rem] text-ink-soft">
                {CATEGORY_LABELS[rc.category]} · {rc.interval} · ab {new Date(rc.startDate + 'T00:00:00').toLocaleDateString('de-DE')}
              </p>
            </div>
            <span className="w-24 text-right text-[0.9rem] font-bold text-ink">{formatEuro(rc.amount, true)} €</span>
            <button onClick={() => deleteRecurring(rc.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger" aria-label="Löschen">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bezeichnung" className={inputCls + ' col-span-2'} />
        <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputCls + ' col-span-1'}>
          {cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="€" className={inputCls + ' col-span-1'} />
        <select value={interval} onChange={(e) => setInterval(e.target.value as RecurringInterval)} className={inputCls + ' col-span-1'}>
          <option value="monatlich">monatlich</option>
          <option value="quartal">quartalsweise</option>
          <option value="jaehrlich">jährlich</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls + ' col-span-1'} />
        <button type="submit" className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 sm:col-span-6">
          <Plus className="h-4 w-4" /> Kostenstelle anlegen
        </button>
      </form>
    </Card>
  );
}

// --- Rechnungs-Formular ---
function InvoiceForm({ defaultNumber, onClose, onSave }: {
  defaultNumber: string;
  onClose: () => void;
  onSave: (inv: Omit<Invoice, 'id' | 'createdAt' | 'paid'>) => void;
}) {
  const [number, setNumber] = useState(defaultNumber);
  const [date, setDate] = useState(todayIso());
  const [client, setClient] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [taxRate, setTaxRate] = useState('19');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState('');

  const setItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const net = invoiceNet(items.filter((it) => it.description.trim()));

  const save = () => {
    const valid = items.filter((it) => it.description.trim() && it.quantity > 0);
    if (!client.trim()) return setError('Bitte Kunde angeben.');
    if (!valid.length) return setError('Bitte mindestens eine Position angeben.');
    onSave({ number, date, client: client.trim(), clientAddress: clientAddress.trim() || undefined, items: valid, taxRate: parseFloat(taxRate) || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Neue Rechnung</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Rechnungsnr."><input value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} /></L>
          <L label="Datum"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></L>
          <L label="Kunde"><input value={client} onChange={(e) => setClient(e.target.value)} className={inputCls} /></L>
          <L label="USt-Satz (%)"><input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" className={inputCls} /></L>
        </div>
        <L label="Kundenadresse (optional)"><textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} className={inputCls} /></L>

        <p className="mt-4 mb-2 text-[0.78rem] font-semibold text-ink-soft">Positionen</p>
        {items.map((it, i) => (
          <div key={i} className="mb-2 grid grid-cols-12 gap-2">
            <input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Beschreibung" className={inputCls + ' col-span-6'} />
            <input value={it.quantity} onChange={(e) => setItem(i, { quantity: parseFloat(e.target.value) || 0 })} inputMode="decimal" placeholder="Menge" className={inputCls + ' col-span-2'} />
            <input value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: parseFloat(e.target.value) || 0 })} inputMode="decimal" placeholder="€/Stk" className={inputCls + ' col-span-3'} />
            <button onClick={() => setItems((a) => a.filter((_, x) => x !== i))} className="col-span-1 grid place-items-center rounded-lg text-ink-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => setItems((a) => [...a, { description: '', quantity: 1, unitPrice: 0 }])} className="text-sm font-semibold text-brand-700">+ Position</button>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="text-ink-soft">Netto / zzgl. {taxRate || 0}% USt</span>
          <span className="font-bold text-ink">{formatEuro(net, true)} € / {formatEuro(net * (1 + (parseFloat(taxRate) || 0) / 100), true)} €</span>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-brand-50">Abbrechen</button>
          <button onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">Rechnung speichern</button>
        </div>
      </div>
    </div>
  );
}

// --- Druckansicht Rechnung ---
function InvoicePrint({ invoice, sender, onClose }: { invoice: Invoice; sender: string; onClose: () => void }) {
  const net = invoiceNet(invoice.items);
  const tax = Math.round(net * (invoice.taxRate / 100) * 100) / 100;
  const gross = net + tax;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4" onClick={onClose}>
      <div className="mx-auto my-4 max-w-2xl">
        <div className="no-print mb-2 flex justify-end gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"><Printer className="h-4 w-4" /> Drucken / PDF</button>
          <button onClick={onClose} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink">Schließen</button>
        </div>
        <div className="print-area rounded-[var(--radius-card)] bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-extrabold text-ink">{sender}</p>
              <p className="text-xs text-ink-soft">Rechnungssteller</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-brand">Rechnung</p>
              <p className="text-sm text-ink-soft">{invoice.number}</p>
            </div>
          </div>
          <div className="mt-6 text-sm">
            <p className="font-semibold text-ink">{invoice.client}</p>
            {invoice.clientAddress && <p className="whitespace-pre-line text-ink-soft">{invoice.clientAddress}</p>}
          </div>
          <p className="mt-4 text-sm text-ink-soft">Rechnungsdatum: {new Date(invoice.date + 'T00:00:00').toLocaleDateString('de-DE')}</p>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="py-2">Beschreibung</th>
                <th className="py-2 text-right">Menge</th>
                <th className="py-2 text-right">Einzel</th>
                <th className="py-2 text-right">Summe</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatEuro(it.unitPrice, true)} €</td>
                  <td className="py-2 text-right">{formatEuro(it.quantity * it.unitPrice, true)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-56 text-sm">
            <div className="flex justify-between py-1"><span className="text-ink-soft">Netto</span><span>{formatEuro(net, true)} €</span></div>
            <div className="flex justify-between py-1"><span className="text-ink-soft">zzgl. {invoice.taxRate}% USt</span><span>{formatEuro(tax, true)} €</span></div>
            <div className="flex justify-between border-t border-ink/20 py-1 font-bold"><span>Gesamt</span><span>{formatEuro(gross, true)} €</span></div>
          </div>

          {invoice.taxRate === 0 && (
            <p className="mt-4 text-[0.72rem] text-ink-soft">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).</p>
          )}
          <p className="mt-6 border-t border-line pt-3 text-[0.72rem] text-ink-soft">
            Pflichtangaben nach § 14 UStG bitte vor Versand prüfen (vollständige Anschrift, Steuernummer/USt-IdNr.).
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-surface';

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 flex flex-col gap-1.5">
      <span className="text-[0.78rem] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
