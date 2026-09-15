import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Crown, Gem, ListTree, Shield, Sparkles, Swords, TrendingUp, Users } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Badge, Button, Card, FieldLabel, PageHeader, Select, TextInput } from '../components/ui';
import {
  computeAdvancedCalcTotals,
  computeDungeonProfit,
  rankDungeonsByEfficiency,
  validateAdvancedCalc,
  buildHandoffComposition,
} from '../utils/advancedCalc';
import { formatCurrency } from '../utils/calculations';
import type { DungeonCategory, PeriodUnit } from '../types';

const CATEGORY_ORDER: DungeonCategory[] = ['armor', 'weapon', 'relic'];
const CATEGORY_ICONS = {
  armor: Shield,
  weapon: Swords,
  relic: Gem,
};

export default function AdvancedCalcPage() {
  const { state, dispatch, dungeons } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<DungeonCategory>('armor');
  const calc = state.advancedCalc;
  const { probabilities, items, prices } = state;

  const totals = computeAdvancedCalcTotals(calc, dungeons, probabilities, items, prices);
  const validation = validateAdvancedCalc(calc);
  const efficiencyRanking = rankDungeonsByEfficiency(calc, dungeons, probabilities, items, prices);
  const activeDungeons = dungeons.filter((d) => d.category === activeCategory);
  const activeProfitRows = activeDungeons.map((dungeon) =>
    computeDungeonProfit(dungeon, calc, probabilities, items, prices),
  );
  const maxActiveDayValue = Math.max(1, ...activeProfitRows.map((row) => row.dayValue));

  const toggleDungeon = (dungeonId: string, checked: boolean) => {
    const next = checked
      ? [...calc.selectedDungeonIds, dungeonId]
      : calc.selectedDungeonIds.filter((id) => id !== dungeonId);
    dispatch({ type: 'SET_ADVANCED_CALC', payload: { selectedDungeonIds: next } });
  };

  const handleGoToMainCalc = () => {
    if (!validation.valid) return;
    const composition = buildHandoffComposition(calc, dungeons);
    dispatch({ type: 'SET_CHEST_COMPOSITION', payload: composition });
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('advancedCalc.title')}
        subtitle={t('advancedCalc.subtitle')}
        icon={<ListTree className="h-7 w-7 text-current" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300/70">
                  {t('advancedCalc.title')}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('advancedCalc.settingsTitle')}</h2>
              </div>
              <Users className="h-5 w-5 text-indigo-500 dark:text-sky-300" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr] sm:items-end">
              <div>
                <FieldLabel>{t('advancedCalc.charactersLabel')}</FieldLabel>
                <TextInput
                  type="number"
                  min={1}
                  max={1000}
                  value={calc.characterCount}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_ADVANCED_CALC',
                      payload: { characterCount: Math.max(1, Math.round(Number(e.target.value) || 1)) },
                    })
                  }
                />
              </div>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-900 transition-all hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.025] dark:text-gray-100 dark:hover:border-sky-400/35 dark:hover:bg-white/[0.045]">
                <input
                  type="checkbox"
                  checked={calc.doubleReward}
                  onChange={(e) => dispatch({ type: 'SET_ADVANCED_CALC', payload: { doubleReward: e.target.checked } })}
                  className="celestial-checkbox"
                />
                <span>{t('advancedCalc.doubleReward')}</span>
                <Sparkles className="ml-auto h-4 w-4 text-amber-500 dark:text-amber-300" />
              </label>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('advancedCalc.dungeonsTitle')}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('advancedCalc.dungeonsHint')}</p>
              </div>
              <Badge>
                {t('advancedCalc.selectedCount')}: {calc.selectedDungeonIds.length}
              </Badge>
            </div>

            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t('advancedCalc.dungeonsTitle')}>
              {CATEGORY_ORDER.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                const active = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(category)}
                    className={`celestial-category-tab ${active ? 'celestial-category-tab-active' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`advancedCalc.category.${category}`)}
                  </button>
                );
              })}
            </div>

            <div className="celestial-dungeon-grid" role="tabpanel">
              {activeProfitRows.map((profit) => {
                const dungeon = profit.dungeon;
                const selected = calc.selectedDungeonIds.includes(dungeon.id);
                const barWidth = Math.max(4, (profit.dayValue / maxActiveDayValue) * 100);
                return (
                  <label
                    key={dungeon.id}
                    className={`celestial-dungeon-tile ${selected ? 'celestial-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => toggleDungeon(dungeon.id, e.target.checked)}
                      className="sr-only"
                    />
                    <span className="relative z-[2] flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0 font-semibold text-gray-900 dark:text-gray-100">{dungeon.name}</span>
                      <span className="celestial-check-mark">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </span>
                    <span className="relative z-[2] flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {dungeon.timeMinutes} {t('advancedCalc.minutesShort')}
                      </span>
                      <span>{formatCurrency(profit.dayValue)} / {t('advancedCalc.periodUnit.day')}</span>
                    </span>
                    <span className="celestial-profit-track relative z-[2]">
                      <span style={{ width: `${barWidth}%` }} />
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300/70">
                  {t('advancedCalc.table.perMinute')}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('advancedCalc.efficiencyTitle')}</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead className="celestial-table-head bg-gray-100 text-left text-gray-600 dark:border-b dark:border-white/10 dark:text-gray-300">
                  <tr>
                    <th className="w-10 px-3 py-2 font-semibold" aria-label="#" />
                    <th className="px-3 py-2 font-semibold">{t('advancedCalc.table.dungeon')}</th>
                    <th className="px-3 py-2 font-semibold">{t('advancedCalc.table.time')}</th>
                    <th className="px-3 py-2 font-semibold">{t('advancedCalc.table.perDay')}</th>
                    <th className="px-3 py-2 font-semibold">{t('advancedCalc.table.perMinute')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {efficiencyRanking.map((row, index) => (
                    <tr key={row.dungeonId} className="celestial-table-row transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs tabular-nums text-gray-400 dark:text-gray-500">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.dungeon.name}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        {row.dungeon.timeMinutes} {t('advancedCalc.minutesShort')}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatCurrency(row.dayValue)}</td>
                      <td className="celestial-accent-text px-3 py-2 font-semibold">
                        {formatCurrency(row.profitPerMinute)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300/70">
                  {t('advancedCalc.summaryTitle')}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('advancedCalc.summaryPerDay')}</h2>
              </div>
              <Crown className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            </div>

            <div className="celestial-profit-hero">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('advancedCalc.summaryPerDay')}
              </p>
              <p className="celestial-profit-value mt-1 text-3xl font-bold tabular-nums">
                {formatCurrency(totals.totalDayValue)}
              </p>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">{t('advancedCalc.summaryPerWeek')}</dt>
                <dd className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrency(totals.totalWeekValue)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">{t('advancedCalc.summaryPerMonth')}</dt>
                <dd className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrency(totals.totalMonthValue)}</dd>
              </div>
            </dl>

            <div className="celestial-mini-bars mt-4" aria-hidden>
              <span style={{ height: '28%' }} />
              <span style={{ height: '39%' }} />
              <span style={{ height: '51%' }} />
              <span style={{ height: '63%' }} />
              <span style={{ height: '76%' }} />
              <span style={{ height: '88%' }} />
              <span style={{ height: '100%' }} />
            </div>

            {Object.keys(totals.byCategory).length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('advancedCalc.summaryBreakdown')}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {CATEGORY_ORDER.filter((category) => totals.byCategory[category]).map((category) => (
                    <li key={category} className="flex justify-between gap-4 text-gray-700 dark:text-gray-300">
                      <span>{t(`advancedCalc.category.${category}`)}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(totals.byCategory[category].dayValue)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{t('advancedCalc.periodTitle')}</h3>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('advancedCalc.periodHint')}</p>
              <div className="flex gap-2">
                <TextInput
                  type="number"
                  min={1}
                  value={calc.periodAmount}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_ADVANCED_CALC',
                      payload: { periodAmount: Math.max(1, Math.round(Number(e.target.value) || 1)) },
                    })
                  }
                  className="w-20"
                />
                <Select
                  value={calc.periodUnit}
                  onChange={(e) =>
                    dispatch({ type: 'SET_ADVANCED_CALC', payload: { periodUnit: e.target.value as PeriodUnit } })
                  }
                >
                  <option value="day">{t('advancedCalc.periodUnit.day')}</option>
                  <option value="week">{t('advancedCalc.periodUnit.week')}</option>
                  <option value="month">{t('advancedCalc.periodUnit.month')}</option>
                  <option value="year">{t('advancedCalc.periodUnit.year')}</option>
                </Select>
              </div>
            </div>

            {!validation.valid && (
              <ul className="mt-4 space-y-1">
                {validation.errors.map((error) => (
                  <li key={error}>
                    <Badge tone="danger">{t(error)}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <Button className="mt-5 w-full" onClick={handleGoToMainCalc} disabled={!validation.valid}>
              {t('advancedCalc.goToMainCalc')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
