// Lokale „Anmeldung": Onboarding-Status + optionale PIN-Sperre.
// Kein Server — die PIN wird nur als SHA-256-Hash lokal gespeichert.

const AUTH_KEY = 'steuerpilot.auth.v1';

export interface AuthData {
  onboarded: boolean;
  pinHash?: string;
}

export function loadAuth(): AuthData {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthData;
  } catch {
    // ignorieren → nicht onboarded
  }
  return { onboarded: false };
}

export function saveAuth(data: AuthData): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
