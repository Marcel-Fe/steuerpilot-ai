// Gekapselte Persistenz über localStorage.
// Das Interface bleibt stabil — in Phase 2 gegen Cloud/Supabase austauschbar,
// ohne UI-Code anzufassen.

import type {
  AppState,
  Receipt,
  ChecklistItem,
  Deadline,
  ExpenseCategory,
  CryptoTransaction,
  TaxMode,
  YearData,
} from '../types';

const STORAGE_KEY = 'steuerpilot.state.v1';

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Seed-Daten: spiegeln das Dashboard-Mockup (Max Mustermann, 124 Belege,
// Kategorie-Summen, Fristen, Checkliste) ---

const SEED_CATEGORY_TARGETS: { category: ExpenseCategory; sum: number; count: number; vendor: string }[] = [
  { category: 'arbeitsmittel', sum: 1450, count: 40, vendor: 'MediaMarkt' },
  { category: 'fahrtkosten', sum: 980, count: 35, vendor: 'Tankstelle / DB' },
  { category: 'homeoffice', sum: 450, count: 20, vendor: 'IKEA' },
  { category: 'fortbildung', sum: 380, count: 15, vendor: 'Udemy' },
  { category: 'sonstiges', sum: 300, count: 14, vendor: 'Diverse' },
];

function buildSeedReceipts(): Receipt[] {
  const receipts: Receipt[] = [];
  const year = 2026;
  for (const t of SEED_CATEGORY_TARGETS) {
    const base = Math.floor((t.sum / t.count) * 100) / 100;
    let allocated = 0;
    for (let i = 0; i < t.count; i++) {
      const isLast = i === t.count - 1;
      const amount = isLast ? Math.round((t.sum - allocated) * 100) / 100 : base;
      allocated = Math.round((allocated + base) * 100) / 100;
      const month = ((i % 6) + 1).toString().padStart(2, '0');
      const day = ((i % 27) + 1).toString().padStart(2, '0');
      receipts.push({
        id: uid(),
        date: `${year}-${month}-${day}`,
        vendor: t.vendor,
        amount,
        category: t.category,
        status: i % 4 === 0 ? 'offen' : 'geprüft',
        createdAt: new Date().toISOString(),
      });
    }
  }
  return receipts;
}

const SEED_CHECKLIST: ChecklistItem[] = [
  // offen (erscheinen unter „Nächste Schritte")
  { id: uid(), title: 'Arbeitsmittel hinzufügen', subtitle: '3 Belege warten auf Prüfung', done: false },
  { id: uid(), title: 'Fahrtkosten prüfen', subtitle: 'Noch nicht begonnen', done: false },
  { id: uid(), title: 'Homeoffice bestätigen', subtitle: 'Nur noch 2 Angaben fehlen', done: false },
  // erledigt (treiben den Steuerfortschritt ~73 %)
  { id: uid(), title: 'Stammdaten vervollständigt', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Lohnsteuerbescheinigung hochgeladen', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Steuerklasse bestätigt', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Bankverbindung hinterlegt', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Versicherungsbeiträge erfasst', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Spenden eingetragen', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Krankenversicherung geprüft', subtitle: 'Erledigt', done: true },
  { id: uid(), title: 'Kontaktdaten aktualisiert', subtitle: 'Erledigt', done: true },
];

const SEED_DEADLINES: Deadline[] = [
  { id: uid(), title: 'Abgabe Steuererklärung', dueDate: '2026-07-31', status: 'offen' },
  { id: uid(), title: 'Lohnsteuerbescheinigung', dueDate: '2026-06-30', status: 'offen' },
  { id: uid(), title: 'Zahlung 1. Rate', dueDate: '2026-05-15', status: 'überfällig' },
];

const SEED_CRYPTO: CryptoTransaction[] = [
  { id: uid(), asset: 'BTC', kind: 'kauf', date: '2024-02-10', quantity: 0.05, totalEur: 2100 },
  { id: uid(), asset: 'ETH', kind: 'kauf', date: '2025-09-01', quantity: 1.2, totalEur: 3000 },
  { id: uid(), asset: 'BTC', kind: 'verkauf', date: '2026-04-20', quantity: 0.03, totalEur: 1950 },
];

// Leeres Jahr anlegen
export function makeYear(year: number, mode: TaxMode = 'angestellt'): YearData {
  return {
    id: uid(),
    year,
    mode,
    receipts: [],
    income: [],
    deadlines: [],
    checklist: [],
    crypto: [],
  };
}

function seedYear(): YearData {
  return {
    id: uid(),
    year: 2026,
    mode: 'angestellt',
    receipts: buildSeedReceipts(),
    income: [],
    deadlines: SEED_DEADLINES,
    checklist: SEED_CHECKLIST,
    crypto: SEED_CRYPTO,
  };
}

function seedState(): AppState {
  const year = seedYear();
  return {
    profile: {
      name: 'Max Mustermann',
      role: 'Angestellter',
      advisorEmail: '',
      createdAt: new Date().toISOString(),
    },
    years: [year],
    activeYearId: year.id,
  };
}

// Migriert ältere Stände: flaches Single-Year-Modell → years[]; ergänzt fehlende Felder.
interface LegacyState {
  profile?: { name?: string; role?: string; taxYear?: number; advisorEmail?: string; createdAt?: string };
  receipts?: Receipt[];
  deadlines?: Deadline[];
  checklist?: ChecklistItem[];
  crypto?: CryptoTransaction[];
  years?: Partial<YearData>[];
  activeYearId?: string;
}

function normalizeYear(y: Partial<YearData>): YearData {
  return {
    id: y.id ?? uid(),
    year: y.year ?? 2026,
    mode: y.mode ?? 'angestellt',
    receipts: y.receipts ?? [],
    income: y.income ?? [],
    deadlines: y.deadlines ?? [],
    checklist: y.checklist ?? [],
    crypto: y.crypto ?? [],
  };
}

function normalize(s: LegacyState): AppState {
  const profile = {
    name: s.profile?.name ?? 'Nutzer',
    role: s.profile?.role ?? 'Angestellter',
    advisorEmail: s.profile?.advisorEmail ?? '',
    createdAt: s.profile?.createdAt ?? new Date().toISOString(),
  };

  // Neues Modell
  if (Array.isArray(s.years) && s.years.length) {
    const years = s.years.map(normalizeYear);
    const activeYearId = years.some((y) => y.id === s.activeYearId) ? s.activeYearId! : years[0].id;
    return { profile, years, activeYearId };
  }

  // Altes flaches Modell → in ein Jahr wandeln
  const legacyYear: YearData = {
    id: uid(),
    year: s.profile?.taxYear ?? 2026,
    mode: 'angestellt',
    receipts: s.receipts ?? [],
    income: [],
    deadlines: s.deadlines ?? [],
    checklist: s.checklist ?? [],
    crypto: s.crypto ?? [],
  };
  return { profile, years: [legacyYear], activeYearId: legacyYear.id };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw) as LegacyState);
  } catch {
    // korrupte Daten → mit Seed neu starten
  }
  const seeded = seedState();
  saveState(seeded);
  return seeded;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage voll/blockiert — bewusst still (Prototyp)
  }
}

export function resetState(): AppState {
  const seeded = seedState();
  saveState(seeded);
  return seeded;
}
