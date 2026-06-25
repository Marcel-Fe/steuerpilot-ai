import { useEffect, useRef, useState } from 'react';
import { Bot, Send, ChevronRight, Mic, Volume2, VolumeX } from 'lucide-react';
import { Card } from './Card';
import { useApp } from '../state/AppContext';
import { askAi, aiConfigured } from '../lib/aiClient';
import { aiProfileContext } from '../lib/calculations';
import {
  recognitionSupported,
  synthSupported,
  createRecognizer,
  speak,
  cancelSpeak,
  type Recognizer,
} from '../lib/speech';
import type { ChatMessage } from '../types';

const SUGGESTIONS = [
  'Kann ich meinen Laptop absetzen?',
  'Wie funktioniert die Homeoffice-Pauschale?',
  'Welche Kosten kann ich noch geltend machen?',
];

export function AiAssistantCard() {
  const { state } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<Recognizer | null>(null);
  const voiceOutRef = useRef(false);
  voiceOutRef.current = voiceOut;

  useEffect(() => () => cancelSpeak(), []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const userMsg: ChatMessage = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    const reply = await askAi(next, aiProfileContext(state));
    setMessages([...next, { role: 'assistant', content: reply }]);
    setLoading(false);
    if (voiceOutRef.current) speak(reply);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const toggleMic = () => {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = createRecognizer(
      (text) => {
        setListening(false);
        send(text);
      },
      () => setListening(false),
    );
    if (!rec) return;
    recognizerRef.current = rec;
    setListening(true);
    rec.start();
  };

  const toggleVoice = () => {
    if (voiceOut) cancelSpeak();
    setVoiceOut((v) => !v);
  };

  const hasChat = messages.length > 0;
  const micOn = recognitionSupported();
  const ttsOn = synthSupported();

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">KI Steuerassistent</h2>
        {ttsOn && (
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold ${
              voiceOut ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-brand-50/60'
            }`}
            title="Antworten vorlesen"
          >
            {voiceOut ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Vorlesen {voiceOut ? 'an' : 'aus'}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-indigo-700">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            SteuerPilot
            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-brand-700">AI</span>
          </p>
          <p className="mt-1 text-[0.86rem] leading-snug text-ink-soft">
            Frag mich alles rund um deine Steuer — per Text oder Mikrofon. Ich helfe dir, nichts zu
            vergessen und das Beste herauszuholen.
          </p>
        </div>
      </div>

      {hasChat && (
        <div ref={scrollRef} className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.86rem] leading-snug ${
                m.role === 'user' ? 'self-end bg-brand text-white' : 'self-start bg-bg text-ink'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start rounded-2xl bg-bg px-3.5 py-2.5 text-[0.86rem] text-ink-soft">
              SteuerPilot denkt nach…
            </div>
          )}
        </div>
      )}

      {!hasChat && (
        <div className="mt-4 flex flex-col gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-[0.86rem] font-medium text-ink transition-colors hover:border-brand hover:bg-brand-50/50"
            >
              {s}
              <ChevronRight className="h-4 w-4 text-ink-soft" />
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg/40 px-2 py-1.5"
      >
        {micOn && (
          <button
            type="button"
            onClick={toggleMic}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors ${
              listening ? 'animate-pulse bg-danger text-white' : 'text-ink-soft hover:bg-brand-50 hover:text-brand'
            }`}
            aria-label="Per Mikrofon sprechen"
            title="Per Mikrofon sprechen"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Ich höre zu…' : 'Stelle eine Frage…'}
          className="flex-1 bg-transparent py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white transition-transform hover:scale-105 disabled:opacity-50"
          aria-label="Senden"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {!aiConfigured() && (
        <p className="mt-2 text-[0.72rem] text-ink-soft">Hinweis: KI-Worker noch nicht verbunden — siehe CONCEPT.md.</p>
      )}
    </Card>
  );
}
