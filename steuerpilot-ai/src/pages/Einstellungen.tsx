import { useState } from 'react';
import { Download, Upload, RotateCcw, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import type { AppState } from '../types';

export function Einstellungen() {
  const { state, updateProfile, replaceState, reset } = useApp();
  const [name, setName] = useState(state.profile.name);
  const [role, setRole] = useState(state.profile.role);
  const [taxYear, setTaxYear] = useState(String(state.profile.taxYear));
  const [note, setNote] = useState('');

  const saveProfile = () => {
    updateProfile({ name: name.trim() || 'Nutzer', role: role.trim(), taxYear: parseInt(taxYear, 10) || state.profile.taxYear });
    setNote('Profil gespeichert ✓');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuerpilot-backup-${state.profile.taxYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      if (!parsed.profile || !Array.isArray(parsed.receipts)) throw new Error('invalid');
      replaceState(parsed);
      setName(parsed.profile.name);
      setRole(parsed.profile.role);
      setTaxYear(String(parsed.profile.taxYear));
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

      <Card className="p-6">
        <h2 className="text-base font-bold text-ink">Profil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tätigkeit">
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Steuerjahr">
            <input value={taxYear} onChange={(e) => setTaxYear(e.target.value)} inputMode="numeric" className={inputCls} />
          </Field>
        </div>
        <button onClick={saveProfile} className="mt-4 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <Save className="h-4 w-4" /> Profil speichern
        </button>
      </Card>

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
