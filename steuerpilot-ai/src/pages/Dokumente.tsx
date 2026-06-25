import { Printer, FileText } from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  expensesByCategory,
  totalExpenses,
  estimatedPotential,
  deadlineViews,
  formatEuro,
} from '../lib/calculations';
import { computeCrypto, FREIGRENZE_EUR } from '../lib/crypto';
import { CATEGORY_LABELS } from '../types';
import type { ExpenseCategory } from '../types';

export function Dokumente() {
  const { state, year } = useApp();
  const cats = expensesByCategory(year.receipts);
  const total = totalExpenses(year.receipts);
  const potential = estimatedPotential(year.receipts);
  const deadlines = deadlineViews(year.deadlines);
  const crypto = computeCrypto(year.crypto);
  const today = new Date().toLocaleDateString('de-DE');

  // Belege je Kategorie gruppiert
  const byCat = (c: ExpenseCategory) =>
    [...year.receipts].filter((r) => r.category === c).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Steuer-Dokument</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Printer className="h-4 w-4" /> Drucken / Als PDF speichern
        </button>
      </div>
      <p className="no-print text-sm text-ink-soft">
        Diese Übersicht fasst alle erfassten Angaben zusammen. Über „Drucken" kannst du sie als PDF
        speichern und an dein Finanzamt oder deinen Steuerberater weitergeben.
      </p>

      <div className="print-area mx-auto w-full max-w-3xl rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
        {/* Kopf */}
        <div className="flex items-start justify-between border-b border-line pb-5">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
              <FileText className="h-6 w-6 text-brand" /> Steuerübersicht {year.year}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {state.profile.name} · {state.profile.role}
            </p>
          </div>
          <p className="text-right text-xs text-ink-soft">
            Erstellt am {today}
            <br />
            SteuerPilot AI
          </p>
        </div>

        {/* Zusammenfassung */}
        <Section title="1. Zusammenfassung">
          <Row label="Werbungskosten / Ausgaben gesamt" value={`${formatEuro(total, true)} €`} />
          <Row label="Anzahl Belege" value={String(year.receipts.length)} />
          <Row label="Krypto – steuerpflichtiger Saldo (laufendes Jahr)" value={`${formatEuro(crypto.taxableGains, true)} €`} />
          <Row label="Geschätztes Steuerpotenzial" value={`ca. ${formatEuro(potential)} €`} strong />
        </Section>

        {/* Werbungskosten je Kategorie */}
        <Section title="2. Werbungskosten nach Kategorie">
          {cats.length === 0 && <p className="text-sm text-ink-soft">Keine Ausgaben erfasst.</p>}
          {cats.map((c) => {
            const items = byCat(c.category);
            return (
              <div key={c.category} className="mb-4 break-inside-avoid">
                <div className="flex items-center justify-between border-b border-line pb-1">
                  <span className="text-sm font-bold text-ink">{CATEGORY_LABELS[c.category]}</span>
                  <span className="text-sm font-bold text-ink">{formatEuro(c.amount, true)} €</span>
                </div>
                <table className="mt-1 w-full text-[0.8rem]">
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} className="text-ink-soft">
                        <td className="py-0.5">{new Date(r.date + 'T00:00:00').toLocaleDateString('de-DE')}</td>
                        <td className="py-0.5">{r.vendor}</td>
                        <td className="py-0.5 text-right">{formatEuro(r.amount, true)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t-2 border-ink/20 pt-2">
            <span className="text-sm font-bold text-ink">Summe Werbungskosten</span>
            <span className="text-sm font-bold text-ink">{formatEuro(total, true)} €</span>
          </div>
        </Section>

        {/* Krypto */}
        <Section title="3. Krypto-Werte (private Veräußerungsgeschäfte)">
          {year.crypto.length === 0 ? (
            <p className="text-sm text-ink-soft">Keine Krypto-Transaktionen erfasst.</p>
          ) : (
            <>
              {crypto.gains.length > 0 && (
                <table className="w-full text-[0.8rem]">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-soft">
                      <th className="py-1 font-semibold">Datum</th>
                      <th className="py-1 font-semibold">Asset</th>
                      <th className="py-1 font-semibold">Einordnung</th>
                      <th className="py-1 text-right font-semibold">Gewinn / Verlust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crypto.gains.map((g, i) => (
                      <tr key={i} className="border-b border-line/60">
                        <td className="py-1">{new Date(g.date + 'T00:00:00').toLocaleDateString('de-DE')}</td>
                        <td className="py-1">{g.asset}</td>
                        <td className="py-1">{g.taxable ? 'steuerpflichtig (< 1 Jahr)' : 'steuerfrei (> 1 Jahr)'}</td>
                        <td className={`py-1 text-right font-semibold ${g.gain >= 0 ? 'text-ink' : 'text-danger'}`}>
                          {g.gain >= 0 ? '+' : ''}
                          {formatEuro(g.gain, true)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-3 space-y-1">
                <Row label="Steuerpflichtiger Saldo (laufendes Jahr)" value={`${formatEuro(crypto.taxableGains, true)} €`} strong />
                <Row label="Steuerfreie Gewinne (> 1 Jahr gehalten)" value={`${formatEuro(crypto.taxFreeGains, true)} €`} />
                <Row
                  label={`Freigrenze (${formatEuro(FREIGRENZE_EUR)} €)`}
                  value={crypto.overFreigrenze ? 'überschritten – steuerpflichtig' : 'nicht überschritten – steuerfrei'}
                />
                {crypto.holdings.length > 0 && (
                  <Row label="Aktuelle Bestände" value={crypto.holdings.map((h) => `${h.quantity} ${h.asset}`).join(', ')} />
                )}
              </div>
              {crypto.taxableGains < 0 && (
                <p className="mt-2 text-[0.78rem] text-ink-soft">
                  Hinweis: Ein negativer Saldo ist ein Verlust und kann mit Gewinnen aus privaten
                  Veräußerungsgeschäften verrechnet bzw. vorgetragen werden.
                </p>
              )}
            </>
          )}
        </Section>

        {/* Fristen */}
        <Section title="4. Fristen & Termine">
          {deadlines.length === 0 ? (
            <p className="text-sm text-ink-soft">Keine Fristen hinterlegt.</p>
          ) : (
            <table className="w-full text-[0.8rem]">
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id} className="border-b border-line/60">
                    <td className="py-1">{new Date(d.dueDate + 'T00:00:00').toLocaleDateString('de-DE')}</td>
                    <td className="py-1">{d.title}</td>
                    <td className="py-1 text-right text-ink-soft">
                      {d.status === 'erledigt' ? 'erledigt' : d.overdue ? 'überfällig' : `in ${d.daysLeft} Tagen`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <p className="mt-6 border-t border-line pt-4 text-[0.72rem] leading-relaxed text-ink-soft">
          Diese Übersicht wurde automatisch aus deinen Eingaben erstellt und dient nur der Orientierung.
          Sie ist <strong>keine verbindliche Steuerberatung</strong> und ersetzt keine offizielle
          Steuererklärung. Beträge und steuerliche Einordnungen sind Schätzungen – bitte vor Abgabe
          prüfen (lassen).
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h3 className="mb-2 text-base font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={strong ? 'font-bold text-brand' : 'font-semibold text-ink'}>{value}</span>
    </div>
  );
}
