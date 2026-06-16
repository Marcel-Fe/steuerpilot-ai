// Einzige Stelle im Frontend, die den KI-Worker kennt.
// Der Gemini-Key liegt NICHT hier, sondern als Secret im Cloudflare-Worker.

import type { ChatMessage } from '../types';

const ENDPOINT = import.meta.env.VITE_KI_ENDPOINT as string | undefined;

export function aiConfigured(): boolean {
  return Boolean(ENDPOINT && ENDPOINT.startsWith('http'));
}

export interface AiProfile {
  name: string;
  role: string;
  taxYear: number;
  receiptCount: number;
  totalExpenses: string;
}

export async function askAi(
  messages: ChatMessage[],
  profile: AiProfile,
): Promise<string> {
  if (!aiConfigured()) {
    return 'Der KI-Assistent ist noch nicht verbunden. Bitte den Cloudflare-Worker deployen und die Worker-URL als VITE_KI_ENDPOINT eintragen (siehe CONCEPT.md).';
  }
  try {
    const res = await fetch(ENDPOINT as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return data?.error
        ? `Es gab ein Problem mit der KI (${data.error}). Bitte später erneut versuchen.`
        : 'Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.';
    }
    return data.reply || 'Dazu habe ich gerade keine Antwort.';
  } catch {
    return 'Die KI ist gerade nicht erreichbar. Bitte Internetverbindung prüfen und erneut versuchen.';
  }
}
