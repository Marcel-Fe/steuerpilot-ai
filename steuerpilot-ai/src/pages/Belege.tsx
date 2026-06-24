import { useState } from 'react';
import { ReceiptText, Plus, Pencil, Trash2, ImageIcon, Download, X } from 'lucide-react';
import { Card } from '../components/Card';
import { ReceiptModal } from '../components/ReceiptModal';
import { useApp } from '../state/AppContext';
import { useUi } from '../state/UiContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { Receipt } from '../types';
import { formatEuro } from '../lib/calculations';
import { receiptsToCsv, downloadFile } from '../lib/exporters';

export function Belege() {
  const { state, deleteReceipt } = useApp();
  const { openReceiptModal } = useUi();
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [viewing, setViewing] = useState<Receipt | null>(null);
  const receipts = [...state.receipts].sort((a, b) => b.date.localeCompare(a.date));

  const exportCsv = () =>
    downloadFile(`belege-${state.profile.taxYear}.csv`, receiptsToCsv(state.receipts), 'text/csv;charset=utf-8');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          Belege <span className="text-ink-soft">({receipts.length})</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700"
          >
            <Download className="h-4 w-4" /> CSV-Export
          </button>
          <button
            onClick={openReceiptModal}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Beleg erfassen
          </button>
        </div>
      </div>

      <Card className="divide-y divide-line">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
            <button
              onClick={() => r.imageDataUrl && setViewing(r)}
              className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl ${
                r.imageDataUrl ? 'cursor-zoom-in' : 'cursor-default'
              } bg-brand-50`}
              aria-label={r.imageDataUrl ? 'Foto ansehen' : 'Kein Foto'}
            >
              {r.imageDataUrl ? (
                <img src={r.imageDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ReceiptText className="h-5 w-5 text-brand" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[0.9rem] font-semibold text-ink">
                {r.vendor}
                {r.imageDataUrl && <ImageIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />}
              </p>
              <p className="text-[0.74rem] text-ink-soft">
                {new Date(r.date + 'T00:00:00').toLocaleDateString('de-DE')}
              </p>
            </div>
            <span
              className="hidden rounded-md px-2 py-1 text-[0.68rem] font-semibold sm:inline"
              style={{ background: CATEGORY_COLORS[r.category] + '1a', color: CATEGORY_COLORS[r.category] }}
            >
              {CATEGORY_LABELS[r.category]}
            </span>
            <span className="w-20 text-right text-[0.9rem] font-bold text-ink">
              {formatEuro(r.amount, true)} €
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setEditing(r)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand"
                aria-label="Bearbeiten"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteReceipt(r.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-danger"
                aria-label="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {receipts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            Noch keine Belege — erfasse deinen ersten Beleg.
          </p>
        )}
      </Card>

      {editing && <ReceiptModal editing={editing} onClose={() => setEditing(null)} />}

      {viewing?.imageDataUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4" onClick={() => setViewing(null)}>
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between text-white">
              <span className="text-sm font-semibold">{viewing.vendor}</span>
              <div className="flex gap-2">
                <a
                  href={viewing.imageDataUrl}
                  download={`beleg-${viewing.date}-${viewing.vendor}.jpg`}
                  className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
                >
                  <Download className="h-4 w-4" /> Speichern
                </a>
                <button onClick={() => setViewing(null)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25" aria-label="Schließen">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <img src={viewing.imageDataUrl} alt={viewing.vendor} className="max-h-[80vh] w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
