/* SteuerPilot AI — Cloudflare Worker: KI-Proxy (Google Gemini)
   © 2026 Marcel Fehse. Alle Rechte vorbehalten.

   Der Gemini-API-Key lebt AUSSCHLIESSLICH hier als Secret (env.GEMINI_API_KEY),
   niemals im Frontend. Der Worker setzt den System-Prompt zentral und gibt nur
   den fertigen Antworttext an die App zurück.

   Deploy:
     1) npm i -g wrangler        (oder: npx wrangler ...)
     2) wrangler login
     3) wrangler secret put GEMINI_API_KEY   (Key von ai.google.dev einfügen)
     4) wrangler deploy
   Danach die Worker-URL im Frontend als VITE_KI_ENDPOINT (.env) eintragen. */

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Du bist „SteuerPilot", der freundliche KI-Steuerassistent einer deutschen Steuer-App für Privatpersonen und Angestellte.
Antworte auf Deutsch, freundlich, kurz und in einfacher Sprache. Erkläre Fachbegriffe, wenn du sie verwendest.

Schwerpunkte: Einkommensteuererklärung für Angestellte, Werbungskosten, Homeoffice-Pauschale, Arbeitsmittel, Fahrtkosten/Pendlerpauschale, Fortbildungskosten, Sonderausgaben, übliche Pauschbeträge.

Strenge Regeln:
- Du gibst allgemeine, verständliche Orientierung — KEINE verbindliche Steuerberatung. Bei komplexen oder rechtlich heiklen Fällen (Selbstständigkeit, Vermietung, Ausland, hohe Beträge, Streit mit dem Finanzamt) verweise klar an eine Steuerberaterin / einen Steuerberater oder einen Lohnsteuerhilfeverein.
- Erfinde keine Paragrafen, Beträge oder Fristen. Wenn du unsicher bist, sage es ehrlich und empfiehl, die aktuelle Angabe beim Finanzamt oder in offiziellen Quellen zu prüfen.
- Beziehe dich, wenn vorhanden, konkret auf die Daten des Nutzers (Kontext unten), bleibe aber praktisch und alltagstauglich.
- Mach Mut: zeige, welche Kosten man absetzen kann und wie man nichts vergisst.`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') {
      return json({ error: 'Nur POST erlaubt.' }, 405);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Server nicht konfiguriert (GEMINI_API_KEY fehlt).' }, 500);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Ungültiges JSON.' }, 400); }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: 'Keine Nachrichten.' }, 400);

    // Steuer-Profil als kurzen Kontext anhängen (für persönlichere Antworten)
    let profileNote = '';
    if (body.profile) {
      const p = body.profile;
      profileNote = `\n\nKontext zum Nutzer (falls hilfreich): Name=${p.name}, Tätigkeit=${p.role}, Steuerjahr=${p.taxYear}, erfasste Belege=${p.receiptCount}, bisherige Ausgaben=${p.totalExpenses} €.`;
    }

    const contents = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }));

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + profileNote }] },
      contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 800 }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    let geminiRes;
    try {
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      return json({ error: 'KI nicht erreichbar.' }, 502);
    }

    if (!geminiRes.ok) {
      const detail = await geminiRes.text().catch(() => '');
      return json({ error: 'KI-Fehler', status: geminiRes.status, detail: detail.slice(0, 300) }, 502);
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || 'Dazu habe ich gerade keine Antwort.';
    return json({ reply });
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}
