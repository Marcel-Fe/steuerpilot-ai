// Sprach-Ein- und -Ausgabe über die Web Speech API (kostenlos, im Browser).
// Spracherkennung (Mikrofon) ist v.a. in Chrome/Edge verfügbar; Sprachausgabe breiter.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function recognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function synthSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface Recognizer {
  start: () => void;
  stop: () => void;
}

// Erstellt eine deutsche Spracherkennung. onResult bekommt den erkannten Text.
export function createRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void,
): Recognizer | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'de-DE';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => {
    const text = e.results?.[0]?.[0]?.transcript ?? '';
    if (text) onResult(text);
  };
  rec.onerror = () => onEnd();
  rec.onend = () => onEnd();
  return {
    start: () => { try { rec.start(); } catch { /* schon aktiv */ } },
    stop: () => { try { rec.stop(); } catch { /* ignore */ } },
  };
}

export function speak(text: string): void {
  if (!synthSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

export function cancelSpeak(): void {
  if (synthSupported()) window.speechSynthesis.cancel();
}
