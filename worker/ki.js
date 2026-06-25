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

const SYSTEM_PROMPT = `Du bist „SteuerPilot", ein KI-Steuerexperte auf dem fachlichen Niveau eines erfahrenen deutschen Steuerberaters. Du berätst Privatpersonen, Angestellte UND Selbstständige/Unternehmer (Einzelunternehmer, Freiberufler, Kleinunternehmer).

Arbeitsweise (intern denken, dann klar antworten):
1. Verstehe die Frage und den Kontext des Nutzers (Steuerjahr, Modus, erfasste Zahlen unten) genau.
2. Denke das steuerlich relevant durch: Welche Einkunftsart? Welche Vorschrift greift? Welche Voraussetzungen, Grenzen, Pauschalen oder Fristen sind wichtig?
3. Antworte strukturiert, präzise und konkret — mit den tatsächlichen Zahlen des Nutzers, wenn sie helfen.

Stil:
- Deutsch, freundlich, klar. Erkläre Fachbegriffe in einem Halbsatz. Nutze kurze Absätze oder Aufzählungen.
- Sei konkret statt allgemein: nenne Beträge, Pauschalen (z. B. Homeoffice-Tagespauschale, Arbeitnehmer-Pauschbetrag, Entfernungspauschale), Paragrafen (z. B. § 9 EStG, § 19 UStG, § 23 EStG) NUR wenn du sicher bist.
- Sei proaktiv: weise auf häufig vergessene absetzbare Kosten und auf Optimierungen hin, die zum Profil passen.
- Im Unternehmer-Modus: denke an Betriebsausgaben, EÜR (Einnahmen-Überschuss-Rechnung), Umsatzsteuer/Vorsteuer, Kleinunternehmerregelung (§ 19), Rechnungspflichtangaben (§ 14 UStG), Aufbewahrungspflichten, Vorauszahlungen.
- Im Angestellt-Modus: Werbungskosten, Homeoffice, Pendlerpauschale, Fortbildung, Sonderausgaben, außergewöhnliche Belastungen.

Strenge Regeln:
- Du gibst fundierte Orientierung, aber KEINE rechtsverbindliche Steuerberatung. Bei komplexen, hohen oder riskanten Fällen empfiehl klar einen Steuerberater / Lohnsteuerhilfeverein.
- Erfinde niemals Paragrafen, Beträge, Grenzen oder Fristen. Bist du unsicher, sage es ehrlich und empfiehl die Prüfung in offiziellen Quellen (Finanzamt, ELSTER, BMF).
- Rechne nur, wenn die Datenlage es hergibt; mache Annahmen transparent.`;

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
      const lines = [
        `Name: ${p.name}`,
        `Tätigkeit: ${p.role}`,
        `Steuerjahr: ${p.year}`,
        `Modus: ${p.mode}`,
        `Erfasste Belege: ${p.receiptCount}`,
        `Ausgaben nach Kategorie: ${p.expensesByCategory}`,
        `Ausgaben gesamt: ${p.totalExpenses} €`,
      ];
      if (p.income != null) lines.push(`Betriebseinnahmen: ${p.income} €`, `Gewinn (EÜR): ${p.profit} €`);
      lines.push(
        `Krypto – steuerpflichtiger Saldo: ${p.cryptoTaxable} €, steuerfrei (>1 Jahr): ${p.cryptoTaxFree} €, über Freigrenze (${p.freigrenze} €): ${p.cryptoOverFreigrenze ? 'ja' : 'nein'}`,
        `Geschätztes Steuerpotenzial: ca. ${p.potential} €`,
        `Offene Fristen: ${p.openDeadlines}`,
      );
      profileNote = `\n\nAktuelle Daten des Nutzers (nutze sie, wenn sie zur Frage passen):\n- ${lines.join('\n- ')}`;
    }

    const contents = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }));

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + profileNote }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 1400 }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    let geminiRes;
    try {
      geminiRes = await geminiFetch(url, payload);
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
    res = await geminiFetch(url, payload);
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

// Gemini-Aufruf mit Retry bei transienten Fehlern (429/500/503).
async function geminiFetch(url, payload, attempts = 3) {
  const body = JSON.stringify(payload);
  let res;
  for (let i = 0; i < attempts; i++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok || ![429, 500, 503].includes(res.status) || i === attempts - 1) return res;
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return res;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}
