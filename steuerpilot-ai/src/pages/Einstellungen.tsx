import { useState } from 'react';
import { Download, Upload, RotateCcw, Save, Lock, LogOut } from 'lucide-react';
import { Card } from '../components/Card';
import { YearManager } from '../components/YearManager';
import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import type { AppState } from '../types';

export function Einstellungen() {
  const { state, year, updateProfile, replaceState, reset } = useApp();
  const { hasPin, setPin, removePin, signOut } = useAuth();
  const [name, setName] = useState(state.profile.name);
  const [role, setRole] = useState(state.profile.role);
  const [note, setNote] = useState('');
  const [newPin, setNewPin] = useState('');

  const savePin = async () => {
    if (!/^\d{4,8}$/.test(newPin)) {
      setNote('Die PIN muss 4–8 Ziffern haben.');
      return;
    }
    await setPin(newPin);
    setNewPin('');
    setNote(hasPin ? 'PIN geändert ✓' : 'PIN gesetzt ✓');
  };

  const saveProfile = () => {
    updateProfile({ name: name.trim() || 'Nutzer', role: role.trim() });
    setNote('Profil gespeichert ✓');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuerpilot-backup-${year.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      if (!parsed.profile || !Array.isArray(parsed.years)) throw new Error('invalid');
      replaceState(parsed);
      setName(parsed.profile.name);
      setRole(parsed.profile.role);
      setNote('Backup erfolgreich importiert ✓');
    } catch {
      setNote('Import fehlgeschlagen — bitte eine gültige SteuerPilot-Backup-Datei wählen.');
    }
  };

  const doReset = () => {
    if (confirm('Wirklich alle Daten auf den Ausgangszustand zurücksetzen? Das kann nicht rückgängig gemacht werden.')) {
      reset();
      setNote('Daten zurückgesetzt.');
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">Einstellungen</h1>

      <Card className="relative overflow-hidden bg-gradient-to-br from-ink-900 to-brand-700 p-6 text-white">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">Premium</span>
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[0.62rem] font-bold tracking-wide">PRO</span>
        </div>
        <p className="mt-1.5 max-w-md text-[0.86rem] leading-snug text-white/80">
          Maximiere dein Steuerpotenzial mit allen Premium-Features: unbegrenzte KI-Beratung, mehrere
          Jahre, Cloud-Sync und Export.
        </p>
        <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-transform hover:scale-[1.02]">
          Jetzt upgraden
        </button>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Profil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tätigkeit">
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <button onClick={saveProfile} className="mt-4 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <Save className="h-4 w-4" /> Profil speichern
        </button>
      </Card>

      <YearManager />

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Daten-Backup</h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">
          Deine Daten liegen nur auf diesem Gerät. Exportiere regelmäßig eine Sicherung.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportJson} className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <Download className="h-4 w-4" /> Als JSON exportieren
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
            <Upload className="h-4 w-4" /> Backup importieren
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
              }}
            />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Lock className="h-5 w-5 text-brand" /> Konto & PIN
        </h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">
          {hasPin ? 'Deine App ist mit einer PIN geschützt.' : 'Schütze die App mit einer PIN (4–8 Ziffern).'}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder={hasPin ? 'Neue PIN' : 'PIN festlegen'}
            className="flex-1 rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-surface"
          />
          <button onClick={savePin} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            <Lock className="h-4 w-4" /> {hasPin ? 'PIN ändern' : 'PIN setzen'}
          </button>
          {hasPin && (
            <button
              onClick={() => { removePin(); setNote('PIN entfernt.'); }}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-brand-50"
            >
              PIN entfernen
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm('Abmelden und Profil neu einrichten? Deine Daten bleiben auf dem Gerät erhalten.')) signOut();
          }}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <LogOut className="h-4 w-4" /> Abmelden / Profil neu einrichten
        </button>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Zurücksetzen</h2>
        <p className="mt-1 text-[0.84rem] text-ink-soft">Setzt alle Daten auf die Beispiel-Daten zurück.</p>
        <button onClick={doReset} className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50">
          <RotateCcw className="h-4 w-4" /> Daten zurücksetzen
        </button>
      </Card>

      {note && <p className="text-sm font-medium text-brand-700">{note}</p>}
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
