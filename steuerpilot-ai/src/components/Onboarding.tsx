import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { TaxProfile } from '../types';

const currentYear = new Date().getFullYear();

export function Onboarding({
  onComplete,
}: {
  onComplete: (patch: Partial<TaxProfile>, pin?: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Angestellter');
  const [taxYear, setTaxYear] = useState(String(currentYear));
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Bitte gib deinen Namen ein.');
    if (usePin) {
      if (!/^\d{4,8}$/.test(pin)) return setError('Die PIN muss 4–8 Ziffern haben.');
      if (pin !== pin2) return setError('Die PINs stimmen nicht überein.');
    }
    setBusy(true);
    await onComplete(
      { name: name.trim(), role: role.trim() || 'Angestellter', taxYear: parseInt(taxYear, 10) || currentYear },
      usePin ? pin : undefined,
    );
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-surface p-7 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-indigo-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">
            SteuerPilot <span className="text-brand">AI</span>
          </span>
        </div>

        <h1 className="mt-6 text-xl font-bold text-ink">Willkommen! 👋</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Richte dein persönliches Steuer-Cockpit ein. Deine Daten bleiben auf diesem Gerät.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label="Dein Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" className={inputCls} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tätigkeit">
              <input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Steuerjahr">
              <input value={taxYear} onChange={(e) => setTaxYear(e.target.value)} inputMode="numeric" className={inputCls} />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-bg p-3 text-sm">
            <input type="checkbox" checked={usePin} onChange={(e) => setUsePin(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
            <span className="font-medium text-ink">App mit PIN schützen (empfohlen)</span>
          </label>

          {usePin && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="PIN (4–8 Ziffern)">
                <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} className={inputCls} />
              </Field>
              <Field label="PIN wiederholen">
                <input type="password" inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            Los geht's <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-surface';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.78rem] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
