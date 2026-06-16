import { ReceiptText, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { useApp } from '../state/AppContext';
import { useUi } from '../state/UiContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { formatEuro } from '../lib/calculations';

export function Belege() {
  const { state } = useApp();
  const { openReceiptModal } = useUi();
  const receipts = [...state.receipts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">
          Belege <span className="text-ink-soft">({receipts.length})</span>
        </h1>
        <button
          onClick={openReceiptModal}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Beleg erfassen
        </button>
      </div>

      <Card className="divide-y divide-line">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50">
              <ReceiptText className="h-5 w-5 text-brand" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9rem] font-semibold text-ink">{r.vendor}</p>
              <p className="text-[0.74rem] text-ink-soft">
                {new Date(r.date + 'T00:00:00').toLocaleDateString('de-DE')}
              </p>
            </div>
            <span
              className="rounded-md px-2 py-1 text-[0.68rem] font-semibold"
              style={{
                background: CATEGORY_COLORS[r.category] + '1a',
                color: CATEGORY_COLORS[r.category],
              }}
            >
              {CATEGORY_LABELS[r.category]}
            </span>
            <span className="w-20 text-right text-[0.9rem] font-bold text-ink">
              {formatEuro(r.amount, true)} €
            </span>
          </div>
        ))}
        {receipts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            Noch keine Belege — erfasse deinen ersten Beleg.
          </p>
        )}
      </Card>
    </div>
  );
}
