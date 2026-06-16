# SteuerPilot AI — Produktkonzept

> Dein persönliches Steuer-Cockpit: Belege, Ausgaben, Fristen und KI-Steueroptimierung in einer App.

## 1. Produktvision

SteuerPilot AI ist die **digitale Steuerzentrale für Privatpersonen und Angestellte**. Die App nimmt der jährlichen Steuererklärung den Schrecken: Sie sammelt Belege, ordnet Ausgaben automatisch den richtigen Steuer-Kategorien zu, erinnert an Fristen und zeigt jederzeit, **wie viel Steuer man noch zurückholen kann**. Ein echter KI-Assistent beantwortet Steuerfragen in einfacher Sprache — ohne dass man Steuerdeutsch verstehen muss.

Kernversprechen: **„Nichts vergessen, das Maximum herausholen — ohne Steuerberater-Stundensatz."**

## 2. Zielgruppe

1. **Angestellte mit Steuererklärungspflicht oder freiwilliger Abgabe** — wollen Werbungskosten, Homeoffice und Arbeitsmittel korrekt absetzen und Geld zurückbekommen.
2. **Steuer-Anfänger** — überfordert von Formularen und Begriffen, brauchen Führung in einfacher Sprache.
3. **Optimierer** — kostenbewusste Nutzer, die das letzte Prozent Erstattung herausholen wollen.

## 3. Alleinstellungsmerkmale (USPs)

- **KI-Steuerassistent** in einfacher Sprache, der konkret auf die eigenen Daten eingeht.
- **Steuerpotenzial-Anzeige**: laufende, verständliche Schätzung der möglichen Erstattung.
- **Beleg-Cockpit**: Belege erfassen, kategorisieren, wiederfinden — statt Schuhkarton.
- **Fristen-Wächter**: keine verpassten Abgabe- oder Zahlungstermine.
- **Premium-Look** statt Behörden-Optik — eine App, die man gern öffnet.

## 4. Monetarisierung (Freemium)

- **Basis (gratis):** 1 Steuerjahr, Belege erfassen, Ausgaben-Übersicht, Fristen, begrenzte KI-Fragen.
- **Premium (~4,99 €/Monat):** unbegrenzte KI-Beratung, mehrere Steuerjahre, Steuer-Analyse & Optimierungs-Tipps, Dokumenten-Export, Cloud-Sync.

## 5. Module (Screens)

| # | Modul | Status Prototyp |
|---|---|---|
| 1 | **Dashboard** (Steuer-Cockpit) | ✅ voll gebaut |
| 2 | **KI Steuerassistent** (Chat) | ✅ echt (Gemini) |
| 3 | **Belege** (erfassen, Liste) | ✅ erfassen + Liste |
| 4 | **Steuer-Checkliste** | 🟡 abhakbare Liste |
| 5 | **Ausgaben** (nach Kategorie) | 🟡 Übersicht |
| 6 | **Steuer-Analyse** | ⏳ Ausblick |
| 7 | **Fristen & Termine** | 🟡 Liste |
| 8 | **Dokumente** | ⏳ Ausblick |
| 9 | **Einstellungen** | 🟡 Profil |

Legende: ✅ fertig · 🟡 schlank/funktional · ⏳ „Bald verfügbar"

## 6. Datenmodell

```
TaxProfile:    name, role, taxYear, createdAt
Receipt:       id, date, vendor, amount, category, imageDataUrl?, status, createdAt
               category ∈ { arbeitsmittel, fahrtkosten, homeoffice, fortbildung, sonstiges }
               status   ∈ { offen, geprüft }
Deadline:      id, title, dueDate, status ∈ { offen, überfällig, erledigt }
ChecklistItem: id, title, subtitle, done
ChatMessage:   role ∈ { user, assistant }, content
```

**Abgeleitete Werte** (berechnet, nicht gespeichert):
- Steuerfortschritt % = erledigte Checklisten-Items / gesamt
- Ausgaben je Kategorie + Gesamtsumme (aus Receipts)
- Mögliches Steuerpotenzial € = regelbasierte Schätzung aus erfassten Ausgaben (Prototyp)
- Fristen-Status / verbleibende Tage = aus `dueDate` vs. heute

## 7. Technische Architektur

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS v4, lucide-react, Recharts, react-router-dom.
- **Persistenz:** gekapselte Storage-Schicht über `localStorage` (Interface → in Phase 2 gegen Cloud/Supabase austauschbar, ohne UI-Code zu ändern).
- **KI:** Google Gemini `gemini-2.5-flash` über einen **Cloudflare-Worker** als Proxy. Der API-Key lebt ausschließlich als Worker-Secret (`GEMINI_API_KEY`), **niemals im Frontend**. Das Frontend kennt nur die Worker-URL (`VITE_KI_ENDPOINT`).

```
[React-App] --POST {messages, profile}--> [Cloudflare-Worker ki.js] --> [Gemini API]
     ^                                            (hält den Key)              |
     |------------------ {reply} -----------------------------------------------
```

## 8. Sicherheit & Datenschutz

- API-Key serverseitig (Worker-Secret), nie im Browser/Repo.
- Daten lokal auf dem Gerät; keine Übertragung außer dem Chat-Text an die KI.
- DSGVO-konform kommuniziert: „Daten bleiben in Deutschland", verschlüsselte Übertragung.
- **Keine verbindliche Steuerberatung** — die KI gibt allgemeine Hilfe und verweist bei komplexen Fällen an Steuerberater. Als Disclaimer in App und System-Prompt verankert.

## 9. Roadmap

- **Phase 1 — Prototyp (diese Session):** App-Shell, Dashboard, Beleg-Erfassung, Ausgaben-Übersicht, Fristen, Checkliste, **echter KI-Chat** über Gemini-Worker.
- **Phase 2 — MVP:** vollständige Beleg-/Ausgaben-/Fristen-Verwaltung, JSON-Export als Sicherung, PWA-Installierbarkeit, optional Cloud/Login (Supabase).
- **Phase 3 — KI-Ausbau:** Beleg-OCR & Auto-Kategorisierung per Vision, datenbasierte Optimierungs-Tipps, intelligente Potenzial-Schätzung.
- **Phase 4 — Premium:** Abo/Paywall, Steuerformular-Export/ELSTER-Anbindung, native App via Capacitor, App-Store-Release.

## 10. KI-Worker Deploy (Kurzanleitung)

```bash
cd worker
npm i -g wrangler          # einmalig
wrangler login
wrangler secret put GEMINI_API_KEY   # Key von ai.google.dev einfügen
wrangler deploy
# Ausgegebene Worker-URL in steuerpilot-ai/.env als VITE_KI_ENDPOINT eintragen
```
