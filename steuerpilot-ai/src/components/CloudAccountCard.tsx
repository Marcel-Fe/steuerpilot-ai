import { useState } from 'react';
import { Cloud, CloudOff, LogIn, UserPlus, LogOut, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { useCloud } from '../state/CloudContext';

export function CloudAccountCard() {
  const { configured, email, status, message, signIn, signUp, signOut, syncNow } = useCloud();
  const [mail, setMail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <CloudOff className="h-5 w-5 text-ink-soft" /> Cloud-Sync
        </h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">
          Cloud-Konto ist noch nicht eingerichtet. Deine Daten liegen aktuell nur auf diesem Gerät.
          Sobald die Supabase-Verbindung hinterlegt ist, kannst du dich hier anmelden und geräteübergreifend synchronisieren.
        </p>
      </Card>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch { /* message kommt aus dem Context */ }
    setBusy(false);
  };

  if (email) {
    return (
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Cloud className="h-5 w-5 text-success" /> Cloud-Sync aktiv
        </h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">
          Angemeldet als <strong>{email}</strong>. Deine Daten werden automatisch synchronisiert.
        </p>
        <p className="mt-1 text-[0.78rem] text-ink-soft">
          Status: {status === 'syncing' ? 'synchronisiert…' : status === 'synced' ? 'aktuell ✓' : status === 'error' ? 'Fehler' : 'bereit'}
          {message && ` · ${message}`}
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => run(syncNow)} disabled={busy} className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <RefreshCw className="h-4 w-4" /> Jetzt synchronisieren
          </button>
          <button onClick={() => run(signOut)} disabled={busy} className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-brand-50">
            <LogOut className="h-4 w-4" /> Abmelden
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        <Cloud className="h-5 w-5 text-brand" /> Cloud-Konto
      </h2>
      <p className="mt-1 text-[0.84rem] text-ink-soft">
        Melde dich an, um deine Steuerdaten sicher in der Cloud zu speichern und auf Handy + PC zu nutzen.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="E-Mail" className={inputCls} />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Passwort (mind. 6 Zeichen)" className={inputCls} />
      </div>
      {message && <p className="mt-2 text-[0.8rem] text-ink-soft">{message}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={() => run(() => signIn(mail, pw))} disabled={busy || !mail || !pw} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <LogIn className="h-4 w-4" /> Anmelden
        </button>
        <button onClick={() => run(() => signUp(mail, pw))} disabled={busy || !mail || !pw} className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 disabled:opacity-50">
          <UserPlus className="h-4 w-4" /> Registrieren
        </button>
      </div>
    </Card>
  );
}

const inputCls = 'w-full rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-surface';
