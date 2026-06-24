import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Assistent } from './pages/Assistent';
import { Belege } from './pages/Belege';
import { Checkliste } from './pages/Checkliste';
import { Ausgaben } from './pages/Ausgaben';
import { Fristen } from './pages/Fristen';
import { Analyse } from './pages/Analyse';
import { Krypto } from './pages/Krypto';
import { Steuerberater } from './pages/Steuerberater';
import { Einstellungen } from './pages/Einstellungen';
import { ComingSoon } from './pages/ComingSoon';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="assistent" element={<Assistent />} />
            <Route path="belege" element={<Belege />} />
            <Route path="checkliste" element={<Checkliste />} />
            <Route path="ausgaben" element={<Ausgaben />} />
            <Route path="analyse" element={<Analyse />} />
            <Route path="krypto" element={<Krypto />} />
            <Route path="fristen" element={<Fristen />} />
            <Route path="dokumente" element={<ComingSoon title="Dokumente" />} />
            <Route path="steuerberater" element={<Steuerberater />} />
            <Route path="einstellungen" element={<Einstellungen />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
