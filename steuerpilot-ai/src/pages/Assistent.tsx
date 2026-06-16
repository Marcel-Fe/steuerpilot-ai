import { AiAssistantCard } from '../components/AiAssistantCard';

export function Assistent() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">KI Steuerassistent</h1>
      <AiAssistantCard />
      <p className="text-center text-[0.74rem] text-ink-soft">
        Allgemeine Hilfe, keine verbindliche Steuerberatung. Bei komplexen Fällen
        wende dich an einen Steuerberater.
      </p>
    </div>
  );
}
