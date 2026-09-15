import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, Calculator, ListTree, Dices, Coins, PieChart } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';
import { useTranslation } from '../../hooks/useTranslation';

const navItems = [
  { to: '/', key: 'header.nav.main', icon: Calculator },
  { to: '/advanced-calc', key: 'header.nav.advanced', icon: ListTree },
  { to: '/simulator', key: 'header.nav.simulator', icon: Dices },
  { to: '/prices', key: 'header.nav.prices', icon: Coins },
  { to: '/probabilities', key: 'header.nav.probabilities', icon: PieChart },
];

export default function Header() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentNavItem = navItems.find(({ to }) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to),
  );
  const CurrentPageIcon = currentNavItem?.icon ?? Coins;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      isActive
        ? 'celestial-nav-active bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100'
    }`;

  return (
    <header className="celestial-header top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-sky-200/10 dark:bg-[#050817]/88 dark:backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
          <span className="celestial-brand-mark flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_0_25px_-4px_rgba(56,189,248,0.78)] ring-1 ring-white/10">
            <CurrentPageIcon className="h-4.5 w-4.5 sm:hidden" />
            <Coins className="hidden h-4.5 w-4.5 sm:block" />
          </span>
          <span className="grid gap-0.5">
            <span className="text-base font-bold leading-none text-slate-900 sm:hidden dark:text-white">
              {t(currentNavItem?.key ?? 'app.shortTitle')}
            </span>
            <span className="celestial-gradient-text hidden text-gray-900 sm:inline dark:text-gray-50">{t('app.title')}</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-sky-100/45 sm:block">
              Perfect World
            </span>
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ to, key, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/'}>
              <Icon className="h-4 w-4" />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <select
            value={state.language}
            onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as 'ru' | 'en' })}
            aria-label={t('header.language')}
            className="celestial-native-select rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-base text-gray-700 transition-colors sm:text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/20"
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>

          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            aria-label={state.theme === 'dark' ? t('header.theme.toggleToLight') : t('header.theme.toggleToDark')}
            className="overflow-hidden rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-amber-300 dark:hover:border-amber-200/25 dark:hover:bg-white/5"
          >
            {state.theme === 'dark' ? (
              <Sun className="h-4 w-4 animate-fade-in-up" />
            ) : (
              <Moon className="h-4 w-4 animate-fade-in-up" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="menu"
            className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 animate-fade-in-up dark:border-white/10 lg:hidden">
          {navItems.map(({ to, key, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/'} onClick={() => setMobileOpen(false)}>
              <Icon className="h-4 w-4" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
