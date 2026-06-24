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
    const apiKey = (env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return json({ error: 'Server nicht konfiguriert (GEMINI_API_KEY fehlt).' }, 500);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Ungültiges JSON.' }, 400); }

    // --- OCR-Modus: Belegfoto auslesen (Gemini Vision) ---
    if (body.image) {
      return await handleOcr(body.image, apiKey);
    }

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

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

// Liest einen Beleg per Gemini Vision aus und gibt strukturierte Felder zurück.
async function handleOcr(imageDataUrl, apiKey) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(imageDataUrl || '');
  if (!match) return json({ error: 'Ungültiges Bildformat.' }, 400);
  const [, mimeType, base64] = match;

  const prompt = `Lies diesen deutschen Kassenbon/Beleg aus. Gib NUR die geforderten Felder zurück.
- vendor: Name des Händlers/Geschäfts.
- amount: Gesamtbetrag in Euro als Zahl (Punkt als Dezimaltrennzeichen, kein Währungszeichen).
- date: Datum im Format YYYY-MM-DD. Wenn unklar, leer lassen.
- category: ordne grob zu eine von arbeitsmittel, fahrtkosten, homeoffice, fortbildung, sonstiges.`;

  const payload = {
    contents: [
      { role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          vendor: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string' },
          category: {
            type: 'string',
            enum: ['arbeitsmittel', 'fahrtkosten', 'homeoffice', 'fortbildung', 'sonstiges'],
          },
        },
        required: ['vendor', 'amount', 'category'],
      },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ error: 'KI nicht erreichbar.' }, 502);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return json({ error: 'KI-Fehler', status: res.status, detail: detail.slice(0, 300) }, 502);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';
  let extraction;
  try { extraction = JSON.parse(text); } catch { return json({ error: 'Antwort nicht lesbar.' }, 502); }
  return json({ extraction });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}
