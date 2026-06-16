import { Rocket } from 'lucide-react';
import { Card } from '../components/Card';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <Card className="grid place-items-center gap-3 p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50">
          <Rocket className="h-7 w-7 text-brand" />
        </span>
        <p className="text-base font-semibold text-ink">Bald verfügbar</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Dieses Modul ist Teil der nächsten Ausbaustufe von SteuerPilot AI.
        </p>
      </Card>
    </div>
  );
}
