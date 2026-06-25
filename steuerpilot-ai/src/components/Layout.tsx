import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, MapPin, Lock, X } from 'lucide-react';
import { Sidebar, SidebarContent } from './Sidebar';
import { Header } from './Header';
import { ReceiptModal } from './ReceiptModal';
import { UiContext } from '../state/UiContext';

export function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <UiContext.Provider
      value={{ openReceiptModal: () => setModalOpen(true), openMenu: () => setMenuOpen(true) }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col px-5 py-6 sm:px-8">
          <Header />
          <main className="mt-6 flex-1">
            <Outlet />
          </main>

          <footer className="no-print mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-line pt-5 text-[0.78rem] text-ink-soft">
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

      {/* Mobiler Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full w-[270px] overflow-y-auto bg-bg p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            key={location.pathname}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-brand-50"
              aria-label="Menü schließen"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {modalOpen && <ReceiptModal onClose={() => setModalOpen(false)} />}
    </UiContext.Provider>
  );
}
