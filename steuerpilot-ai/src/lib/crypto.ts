// Krypto-Berechnungen für die private Veräußerung (§23 EStG, vereinfacht).
// WICHTIG: Schätzung, keine verbindliche Steuerberatung.

import type { CryptoTransaction } from '../types';

export const FREIGRENZE_EUR = 1000; // private Veräußerungsgeschäfte ab 2024
const HOLD_DAYS_TAXFREE = 365; // > 1 Jahr Haltefrist = steuerfrei

export interface CryptoHolding {
  asset: string;
  quantity: number; // aktuell gehaltene Menge
  costBasis: number; // verbleibende Anschaffungskosten in Euro
}

export interface RealizedGain {
  asset: string;
  date: string; // Verkaufsdatum
  proceeds: number; // Verkaufserlös (abzgl. Gebühr)
  cost: number; // anteilige Anschaffungskosten
  gain: number; // proceeds - cost
  taxable: boolean; // innerhalb Haltefrist verkauft → steuerpflichtig
}

interface Lot {
  quantity: number;
  pricePerCoin: number;
  date: string;
}

// FIFO-Verarbeitung pro Asset: Käufe als Lots, Verkäufe matchen die ältesten Lots.
export function computeCrypto(transactions: CryptoTransaction[]) {
  const byAsset = new Map<string, CryptoTransaction[]>();
  for (const t of transactions) {
    const list = byAsset.get(t.asset) ?? [];
    list.push(t);
    byAsset.set(t.asset, list);
  }

  const holdings: CryptoHolding[] = [];
  const gains: RealizedGain[] = [];

  for (const [asset, txs] of byAsset) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const lots: Lot[] = [];

    for (const t of sorted) {
      if (t.kind === 'kauf') {
        const fee = t.feeEur ?? 0;
        const pricePerCoin = t.quantity > 0 ? (t.totalEur + fee) / t.quantity : 0;
        lots.push({ quantity: t.quantity, pricePerCoin, date: t.date });
        continue;
      }
      // Verkauf: gegen älteste Lots verrechnen
      let remaining = t.quantity;
      const proceeds = t.totalEur - (t.feeEur ?? 0);
      const proceedsPerCoin = t.quantity > 0 ? proceeds / t.quantity : 0;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(remaining, lot.quantity);
        const cost = used * lot.pricePerCoin;
        const saleProceeds = used * proceedsPerCoin;
        const heldDays = daysBetween(lot.date, t.date);
        gains.push({
          asset,
          date: t.date,
          proceeds: round(saleProceeds),
          cost: round(cost),
          gain: round(saleProceeds - cost),
          taxable: heldDays <= HOLD_DAYS_TAXFREE,
        });
        lot.quantity -= used;
        remaining -= used;
        if (lot.quantity <= 1e-12) lots.shift();
      }
    }

    const quantity = lots.reduce((s, l) => s + l.quantity, 0);
    const costBasis = lots.reduce((s, l) => s + l.quantity * l.pricePerCoin, 0);
    if (quantity > 1e-9) holdings.push({ asset, quantity: round(quantity, 8), costBasis: round(costBasis) });
  }

  // Steuerpflichtige Gewinne des laufenden Jahres summieren
  const year = new Date().getFullYear();
  const taxableGains = gains
    .filter((g) => g.taxable && g.date.startsWith(String(year)))
    .reduce((s, g) => s + g.gain, 0);

  const taxFreeGains = gains
    .filter((g) => !g.taxable)
    .reduce((s, g) => s + g.gain, 0);

  return {
    holdings,
    gains: gains.sort((a, b) => b.date.localeCompare(a.date)),
    taxableGains: round(taxableGains),
    taxFreeGains: round(taxFreeGains),
    overFreigrenze: taxableGains >= FREIGRENZE_EUR,
  };
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
