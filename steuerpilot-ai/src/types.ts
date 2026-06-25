// Datenmodell — einzige Quelle der Wahrheit für die App.
// Beträge in Euro (number), Datumswerte als ISO-String "YYYY-MM-DD".

export type ExpenseCategory =
  // Angestellte (Werbungskosten)
  | 'arbeitsmittel'
  | 'fahrtkosten'
  | 'homeoffice'
  | 'fortbildung'
  | 'sonstiges'
  // Unternehmer (Betriebsausgaben)
  | 'wareneinkauf'
  | 'buero'
  | 'reisekosten'
  | 'marketing'
  | 'versicherungen'
  | 'miete';

export type TaxMode = 'angestellt' | 'unternehmer';

export type ReceiptStatus = 'offen' | 'geprüft';

export type DeadlineStatus = 'offen' | 'überfällig' | 'erledigt';

export interface TaxProfile {
  name: string;
  role: string; // z.B. "Angestellter"
  advisorEmail?: string; // E-Mail des Steuerberaters
  createdAt: string;
}

export type CryptoKind = 'kauf' | 'verkauf';

export interface CryptoTransaction {
  id: string;
  asset: string; // z.B. "BTC", "ETH"
  kind: CryptoKind;
  date: string; // ISO YYYY-MM-DD
  quantity: number; // Menge der Coins
  totalEur: number; // gezahlter/erhaltener Gesamtbetrag in Euro
  feeEur?: number;
  note?: string;
}

export interface Receipt {
  id: string;
  date: string; // ISO YYYY-MM-DD
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  imageDataUrl?: string;
  status: ReceiptStatus;
  createdAt: string;
}

// Einnahme (nur Unternehmer-Modus)
export interface IncomeEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  client: string; // Kunde/Quelle
  amount: number; // netto/brutto Euro
  note?: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // ISO YYYY-MM-DD
  status: DeadlineStatus;
}

export interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  done: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Daten eines einzelnen Steuerjahres
export interface YearData {
  id: string;
  year: number;
  mode: TaxMode;
  receipts: Receipt[];
  income: IncomeEntry[];
  deadlines: Deadline[];
  checklist: ChecklistItem[];
  crypto: CryptoTransaction[];
}

export interface AppState {
  profile: TaxProfile;
  years: YearData[];
  activeYearId: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  arbeitsmittel: 'Arbeitsmittel',
  fahrtkosten: 'Fahrtkosten',
  homeoffice: 'Homeoffice',
  fortbildung: 'Fortbildung',
  sonstiges: 'Sonstiges',
  wareneinkauf: 'Wareneinkauf',
  buero: 'Büro & Material',
  reisekosten: 'Reisekosten',
  marketing: 'Marketing & Werbung',
  versicherungen: 'Versicherungen & Beiträge',
  miete: 'Miete & Raumkosten',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  arbeitsmittel: '#6366f1',
  fahrtkosten: '#3b82f6',
  homeoffice: '#2dd4bf',
  fortbildung: '#fb923c',
  sonstiges: '#fbbf24',
  wareneinkauf: '#6366f1',
  buero: '#3b82f6',
  reisekosten: '#2dd4bf',
  marketing: '#fb923c',
  versicherungen: '#a855f7',
  miete: '#f43f5e',
};

const EMPLOYEE_CATS: ExpenseCategory[] = ['arbeitsmittel', 'fahrtkosten', 'homeoffice', 'fortbildung', 'sonstiges'];
const BUSINESS_CATS: ExpenseCategory[] = ['wareneinkauf', 'buero', 'reisekosten', 'marketing', 'versicherungen', 'fortbildung', 'miete', 'sonstiges'];

export function categoriesForMode(mode: TaxMode): ExpenseCategory[] {
  return mode === 'unternehmer' ? BUSINESS_CATS : EMPLOYEE_CATS;
}
