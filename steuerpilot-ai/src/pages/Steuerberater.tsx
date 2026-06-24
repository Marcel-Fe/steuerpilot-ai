import { useState } from 'react';
import { Mail, Download, Send, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { expensesByCategory, totalExpenses, estimatedPotential, formatEuro } from '../lib/calculations';
import { receiptsToCsv, downloadFile, buildAdvisorEmail, openAdvisorMail } from '../lib/exporters';

export function Steuerberater() {
  const { state, updateProfile } = useApp();
  const [email, setEmail] = useState(state.profile.advisorEmail ?? '');
  const [saved, setSaved] = useState(false);

  const cats = expensesByCategory(state.receipts);
  const total = totalExpenses(state.receipts);
  const potential = estimatedPotential(state.receipts);
  const preview = buildAdvisorEmail(state);

  const saveEmail = () => {
    updateProfile({ advisorEmail: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportCsv = () =>
    downloadFile(`belege-${state.profile.taxYear}.csv`, receiptsToCsv(state.receipts), 'text/csv;charset=utf-8');

  const send = () => {
    updateProfile({ advisorEmail: email.trim() });
    openAdvisorMail({ ...state, profile: { ...state.profile, advisorEmail: email.trim() } });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">An Steuerberater senden</h1>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">E-Mail-Adresse des Steuerberaters</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kanzlei@steuerberater.de"
            className="flex-1 rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface"
          />
          <button onClick={saveEmail} className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <Save className="h-4 w-4" /> {saved ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Zusammenfassung {state.profile.taxYear}</h2>
        <ul className="mt-3 space-y-1.5 text-[0.88rem]">
          {cats.map((c) => (
            <li key={c.category} className="flex justify-between">
              <span className="text-ink-soft">{c.label}</span>
              <span className="font-semibold text-ink">{formatEuro(c.amount, true)} €</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-line pt-1.5">
            <span className="font-semibold text-ink">Gesamt ({state.receipts.length} Belege)</span>
            <span className="font-bold text-ink">{formatEuro(total, true)} €</span>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-soft">Geschätztes Potenzial</span>
            <span className="font-semibold text-brand">ca. {formatEuro(potential)} €</span>
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Versand</h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">
          So funktioniert's: Lade zuerst die Belegliste als CSV herunter, dann öffne die vorausgefüllte
          E-Mail und hänge die CSV-Datei an. (E-Mails können aus Sicherheitsgründen keine Dateien
          automatisch anhängen.)
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <Download className="h-4 w-4" /> 1. Belegliste (CSV) herunterladen
          </button>
          <button onClick={send} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            <Send className="h-4 w-4" /> 2. E-Mail öffnen
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Mail className="h-5 w-5 text-brand" /> Vorschau der E-Mail
        </h2>
        <p className="mt-2 text-[0.78rem] font-semibold text-ink-soft">Betreff: {preview.subject}</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-bg p-4 text-[0.82rem] text-ink">{preview.body}</pre>
      </Card>
    </div>
  );
}
