import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import { AuthProvider } from './state/AuthContext';
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
import { Dokumente } from './pages/Dokumente';
import { Einstellungen } from './pages/Einstellungen';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
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
            <Route path="dokumente" element={<Dokumente />} />
            <Route path="steuerberater" element={<Steuerberater />} />
            <Route path="einstellungen" element={<Einstellungen />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
      </AuthProvider>
    </AppProvider>
  );
}
