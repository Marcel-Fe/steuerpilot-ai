import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck, MapPin, Lock } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReceiptModal } from './ReceiptModal';
import { UiContext } from '../state/UiContext';

export function Layout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <UiContext.Provider value={{ openReceiptModal: () => setModalOpen(true) }}>
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col px-5 py-6 sm:px-8">
          <Header />
          <main className="mt-6 flex-1">
            <Outlet />
          </main>

          <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-line pt-5 text-[0.78rem] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> Sicher & DSGVO-konform
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand" /> Deine Daten bleiben in Deutschland
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-ink-soft" /> Verschlüsselte Übertragung
            </span>
          </footer>
        </div>
      </div>

      {modalOpen && <ReceiptModal onClose={() => setModalOpen(false)} />}
    </UiContext.Provider>
  );
}
