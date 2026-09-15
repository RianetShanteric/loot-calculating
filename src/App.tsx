import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Layout/Header';
import MainPage from './pages/MainPage';
import AdvancedCalcPage from './pages/AdvancedCalcPage';
import SimulatorPage from './pages/SimulatorPage';
import PricesPage from './pages/PricesPage';
import ProbabilitiesPage from './pages/ProbabilitiesPage';
import { useTranslation } from './hooks/useTranslation';

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden dark:block" aria-hidden>
      <div className="celestial-aurora -top-40 -left-40 h-[36rem] w-[36rem] bg-violet-500/32 [animation:blob-drift_22s_ease-in-out_infinite]" />
      <div className="celestial-aurora top-1/5 -right-44 h-[38rem] w-[38rem] bg-sky-500/26 [animation:blob-drift_27s_ease-in-out_infinite_reverse]" />
      <div className="celestial-aurora bottom-[-10rem] left-1/5 h-[34rem] w-[34rem] bg-emerald-400/18 [animation:blob-drift_20s_ease-in-out_infinite]" />
      <div className="celestial-aurora top-1/2 right-1/4 h-[24rem] w-[24rem] bg-amber-300/12 [animation:blob-drift_25s_ease-in-out_infinite_reverse]" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <main key={location.pathname} className="relative animate-fade-in-up">
      <Routes location={location}>
        <Route path="/" element={<MainPage />} />
        <Route path="/advanced-calc" element={<AdvancedCalcPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/probabilities" element={<ProbabilitiesPage />} />
      </Routes>
    </main>
  );
}

function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="celestial-app-shell min-h-screen bg-gray-50 dark:bg-transparent">
        <AmbientBackground />
        <div className="celestial-grid-overlay" aria-hidden />
        <Header />
        <AppRoutes />
        <footer className="mt-12 border-t border-gray-200 bg-white dark:border-sky-200/10 dark:bg-[#050817]/35 dark:backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-500 sm:px-6 lg:px-8">
            <p>{t('app.footer.line1')}</p>
            <p className="mt-1">{t('app.footer.line2')}</p>
            <p className="mt-1">
              {t('app.footer.creditPrefix')}{' '}
              <a
                href="https://coldgun.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
              >
                coldgun.ru
              </a>
              {t('app.footer.creditSuffix')}
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
