import { useState } from 'react';
import { X, Upload, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { CATEGORY_LABELS } from '../types';
import type { ExpenseCategory, Receipt } from '../types';
import { extractReceipt, aiConfigured } from '../lib/aiClient';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Bild clientseitig auf max. 1024px verkleinern → kleine DataURL für localStorage
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReceiptModal({ onClose, editing }: { onClose: () => void; editing?: Receipt }) {
  const { addReceipt, updateReceipt } = useApp();
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [vendor, setVendor] = useState(editing?.vendor ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(editing?.category ?? 'arbeitsmittel');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(editing?.imageDataUrl);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');

  const onFile = async (file: File) => {
    const dataUrl = await compressImage(file);
    setImageDataUrl(dataUrl);
    if (!aiConfigured()) return;
    setScanning(true);
    setScanNote('');
    const result = await extractReceipt(dataUrl);
    setScanning(false);
    if (!result) {
      setScanNote('Automatisches Auslesen nicht möglich — bitte Felder prüfen.');
      return;
    }
    if (result.vendor) setVendor(result.vendor);
    if (typeof result.amount === 'number' && result.amount > 0) setAmount(String(result.amount));
    if (result.date) setDate(result.date);
    if (result.category) setCategory(result.category);
    setScanNote('Beleg automatisch ausgelesen — bitte kurz prüfen. ✨');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (!vendor.trim()) return setError('Bitte einen Händler/Zweck angeben.');
    if (!value || value <= 0) return setError('Bitte einen gültigen Betrag angeben.');
    if (editing) {
      updateReceipt(editing.id, { date, vendor: vendor.trim(), amount: value, category, imageDataUrl });
    } else {
      addReceipt({ date, vendor: vendor.trim(), amount: value, category, imageDataUrl });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{editing ? 'Beleg bearbeiten' : 'Beleg erfassen'}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Foto (optional — wird automatisch ausgelesen)">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-ink-soft hover:border-brand">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {scanning ? 'Beleg wird ausgelesen…' : imageDataUrl ? 'Foto ausgewählt ✓ — anderes wählen' : 'Beleg-Foto hochladen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await onFile(f);
                }}
              />
            </label>
            {scanNote && (
              <span className="mt-1 flex items-center gap-1 text-[0.74rem] text-brand-700">
                <Sparkles className="h-3 w-3" /> {scanNote}
              </span>
            )}
          </Field>

          <Field label="Datum">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Händler / Zweck">
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="z.B. MediaMarkt — Laptop"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Betrag (€)">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={inputCls}
              />
            </Field>
            <Field label="Kategorie">
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-brand-50">
              Abbrechen
            </button>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
              {editing ? 'Änderungen speichern' : 'Beleg speichern'}
            </button>
          </div>
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
