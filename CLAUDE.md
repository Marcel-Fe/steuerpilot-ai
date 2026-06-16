# CLAUDE.md — SteuerPilot AI

Arbeitsanweisungen für alle Sessions an diesem Projekt. Konzept siehe [CONCEPT.md](CONCEPT.md).

## Projektüberblick

Premium-Steuer-Assistent-App für Privatpersonen/Angestellte („Steuer-Cockpit"). Verwaltet Belege, Ausgaben, Fristen und bietet einen echten KI-Steuerassistenten (Google Gemini). Web-App, lokal-first.

## Tech-Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** (helles Premium-Design)
- **lucide-react** (Icons), **Recharts** (Diagramme), **react-router-dom** (Navigation)
- **Persistenz:** gekapselte Storage-Schicht über `localStorage` (`src/storage/store.ts`) — Interface bleibt stabil, Backend in Phase 2 austauschbar.
- **KI:** Google Gemini `gemini-2.5-flash` über **Cloudflare-Worker** (`worker/ki.js`).

## Projektstruktur

```
CONCEPT.md, CLAUDE.md
worker/                 ← Cloudflare-Worker (Gemini-Proxy)
  ki.js, wrangler.toml
steuerpilot-ai/         ← Vite-App
  public/icon.png       ← App-Icon / Favicon
  src/
    types.ts            ← Datenmodell (einzige Quelle der Wahrheit)
    storage/store.ts    ← localStorage-Schicht + Seed-Daten
    lib/calculations.ts ← abgeleitete Werte (Fortschritt, Potenzial, Summen)
    lib/aiClient.ts     ← EINZIGE Stelle, die den KI-Worker kennt
    components/         ← Sidebar, Header, Cards, UI-Bausteine
    pages/              ← Dashboard.tsx + Modul-Seiten
    App.tsx, main.tsx, index.css
```

## Design-Regeln

- **Helles Premium-Design** nach Mockup: weiße Karten auf hellgrauem Grund (`#F5F6FA`), weiche Rundungen (≈16px), dezente Schatten, ruhige Animationen.
- **Farben:** Primär Indigo/Violett `#6366F1`, Sekundär Teal `#2DD4BF` / Grün `#10B981` (Erfolg/Schild), Warnung/Überfällig Rot `#EF4444`, Text dunkel `#1E2233`.
- **Sprache:** UI-Texte **Deutsch**. Code (Variablen, Funktionen, Dateinamen) **Englisch**.
- **Ton:** freundlich, einfach, ermutigend — kein Steuerdeutsch ohne Erklärung.

## Datenmodell-Konventionen

- Typen zentral in `src/types.ts`. Beträge in Euro als `number`. Datumswerte als ISO-String (`YYYY-MM-DD`).
- Berechnete Werte **nie speichern** — immer aus `src/lib/calculations.ts` ableiten.
- Beleg-Kategorien: `arbeitsmittel | fahrtkosten | homeoffice | fortbildung | sonstiges`.

## KI / Worker — kritische Regel

- Der **Gemini-API-Key liegt ausschließlich als Worker-Secret** (`GEMINI_API_KEY`), **niemals** im Frontend, in `.env` des Frontends oder im Repo.
- Das Frontend kennt nur die Worker-URL über `VITE_KI_ENDPOINT`.
- System-Prompt + Modellwahl leben zentral in `worker/ki.js`.
- Deploy: `wrangler login` → `wrangler secret put GEMINI_API_KEY` → `wrangler deploy` → URL in `steuerpilot-ai/.env` eintragen.

## Befehle

```bash
cd steuerpilot-ai
npm install        # Abhängigkeiten
npm run dev        # Dev-Server
npm run build      # Production-Build (muss fehlerfrei sein)
npm run preview    # Build lokal testen

cd worker
wrangler deploy    # KI-Worker veröffentlichen
```

## Roadmap-Stand

- **Phase 1 (aktuell):** Prototyp — Dashboard, Beleg-Erfassung, Ausgaben/Fristen/Checkliste, echter KI-Chat. ✅
- Phase 2: vollständige Verwaltung, JSON-Export, PWA, optional Cloud/Login.
- Phase 3: Beleg-OCR + Auto-Kategorisierung + KI-Optimierung (Vision).
- Phase 4: Abo/Paywall, ELSTER-Export, native App (Capacitor).

## Wichtige Hinweise

- **Keine verbindliche Steuerberatung** — als Disclaimer in App + KI-System-Prompt halten.
- Belegfotos vor dem Speichern clientseitig komprimieren (localStorage-Limit ~5–10 MB).
- Bestehenden Code lesen, bevor er geändert wird; nach vorhandenen Implementierungen suchen, bevor neue entstehen.
