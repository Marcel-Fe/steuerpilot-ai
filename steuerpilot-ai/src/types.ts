// Datenmodell — einzige Quelle der Wahrheit für die App.
// Beträge in Euro (number), Datumswerte als ISO-String "YYYY-MM-DD".

export type ExpenseCategory =
  | 'arbeitsmittel'
  | 'fahrtkosten'
  | 'homeoffice'
  | 'fortbildung'
  | 'sonstiges';

export type ReceiptStatus = 'offen' | 'geprüft';

export type DeadlineStatus = 'offen' | 'überfällig' | 'erledigt';

export interface TaxProfile {
  name: string;
  role: string; // z.B. "Angestellter"
  taxYear: number;
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

export interface AppState {
  profile: TaxProfile;
  receipts: Receipt[];
  deadlines: Deadline[];
  checklist: ChecklistItem[];
  crypto: CryptoTransaction[];
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  arbeitsmittel: 'Arbeitsmittel',
  fahrtkosten: 'Fahrtkosten',
  homeoffice: 'Homeoffice',
  fortbildung: 'Fortbildung',
  sonstiges: 'Sonstiges',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  arbeitsmittel: '#6366f1',
  fahrtkosten: '#3b82f6',
  homeoffice: '#2dd4bf',
  fortbildung: '#fb923c',
  sonstiges: '#fbbf24',
};
