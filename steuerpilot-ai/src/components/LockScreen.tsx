import { useState } from 'react';
import { Lock } from 'lucide-react';
import { hashPin } from '../state/auth';

export function LockScreen({ pinHash, onUnlock }: { pinHash: string; onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((await hashPin(pin)) === pinHash) {
      onUnlock();
    } else {
      setError('Falsche PIN.');
      setPin('');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4">
      <form onSubmit={submit} className="w-full max-w-xs rounded-[var(--radius-card)] bg-surface p-7 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50">
          <Lock className="h-6 w-6 text-brand" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-ink">SteuerPilot ist gesperrt</h1>
        <p className="mt-1 text-sm text-ink-soft">Bitte gib deine PIN ein.</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-5 w-full rounded-xl border border-line bg-bg/40 px-3 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-brand focus:bg-surface"
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white">
          Entsperren
        </button>
      </form>
    </div>
  );
}
