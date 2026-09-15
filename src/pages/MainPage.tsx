import { useState } from 'react';
import { Calculator, Coins, PackageOpen, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  calculateGrandTotal,
  calculateMainResults,
  deviationClass,
  formatCurrency,
  formatDeviation,
  formatPercent,
  pluralizeRu,
} from '../utils/calculations';
import { Badge, Button, Card, ItemIcon, PageHeader, Select, TextInput } from '../components/ui';

const MAX_CHESTS = 1_000_000;

export default function MainPage() {
  const { state, dispatch } = useAppContext();
  const { t, language } = useTranslation();
  const { chestComposition, chests } = state;

  const { results, totalChests } = calculateMainResults(state);
  const grandTotal = calculateGrandTotal(results);

  // Local draft text lets the user briefly clear a field while typing without it snapping
  // back to a parsed number; the committed value (used everywhere else) updates immediately.
  const [draft, setDraft] = useState<Record<string, string>>({});

  const updateRow = (index: number, chestId: string, count: number) => {
    dispatch({ type: 'UPDATE_CHEST_ROW', payload: { index, row: { chestId, count } } });
  };

  const handleActualChange = (itemId: string, value: string) => {
    setDraft((prev) => ({ ...prev, [itemId]: value }));
    const parsed = Math.max(0, Math.round(Number(value) || 0));
    dispatch({ type: 'SET_ACTUAL_DROP', payload: { itemId, value: parsed } });
  };

  const handleResetToExpected = () => {
    setDraft({});
    dispatch({ type: 'RESET_ACTUAL_DROPS' });
  };

  const usedChestIds = new Set(chestComposition.map((r) => r.chestId));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('mainPage.title')}
        subtitle={t('mainPage.subtitle')}
        icon={<Calculator className="h-7 w-7 text-current" />}
      />

      <Card className="mb-6 overflow-hidden">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="celestial-section-icon">
              <PackageOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300/70">
                Perfect World
              </p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('mainPage.compositionTitle')}</h2>
            </div>
          </div>
          <div className="celestial-total-chip">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('mainPage.totalChests')}</span>
            <strong>{formatCurrency(totalChests)}</strong>
          </div>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t('mainPage.compositionHint')}</p>

        <div className="space-y-3">
          {chestComposition.map((row, index) => (
            <div key={index} className="celestial-composition-row flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="hidden w-7 shrink-0 text-center text-xs font-semibold tabular-nums text-gray-400 sm:block dark:text-sky-100/35">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <Select
                  value={row.chestId}
                  onChange={(e) => updateRow(index, e.target.value, row.count)}
                >
                  <option value="">{t('mainPage.chestType')}</option>
                  {chests.map((c) => (
                    <option key={c.id} value={c.id} disabled={usedChestIds.has(c.id) && c.id !== row.chestId}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <TextInput
                  type="number"
                  min={0}
                  max={MAX_CHESTS}
                  value={row.count}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(MAX_CHESTS, Math.round(Number(e.target.value) || 0)));
                    updateRow(index, row.chestId, v);
                  }}
                  placeholder={t('mainPage.chestCount')}
                />
              </div>
              <Button
                variant="ghost"
                className="self-end sm:self-auto"
                onClick={() => dispatch({ type: 'REMOVE_CHEST_ROW', payload: index })}
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="secondary" className="mt-4" onClick={() => dispatch({ type: 'ADD_CHEST_ROW' })}>
          <Plus className="h-4 w-4" />
          {t('mainPage.addChestRow')}
        </Button>
      </Card>

      <div className="mb-4 flex justify-end">
        <Button variant="secondary" onClick={handleResetToExpected}>
          <RefreshCw className="h-4 w-4" />
          {t('mainPage.resetToExpected')}
        </Button>
      </div>

      {results.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <PackageOpen className="mx-auto mb-3 h-8 w-8 text-gray-400 dark:text-sky-200/35" />
            <p className="text-gray-500 dark:text-gray-400">{t('mainPage.noChests')}</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="celestial-section-icon h-9 w-9">
                <Coins className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-sky-100/45">
                  {t('mainPage.grandTotal')}
                </p>
                <p className="celestial-profit-value text-xl font-bold tabular-nums">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
            <Badge>
              {results.length}{' '}
              {language === 'ru'
                ? pluralizeRu(
                    results.length,
                    t('mainPage.itemsCount.one'),
                    t('mainPage.itemsCount.few'),
                    t('mainPage.itemsCount.many'),
                  )
                : t(results.length === 1 ? 'mainPage.itemsCount.one' : 'mainPage.itemsCount.many')}
            </Badge>
          </div>
          <table className="w-full min-w-[800px] text-sm">
            <thead className="celestial-table-head bg-gray-100 text-left text-gray-600 dark:border-b dark:border-white/10 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.item')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.probability')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.expected')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.actual')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.deviation')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.price')}</th>
                <th className="px-4 py-3 font-semibold">{t('mainPage.table.value')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {results.map((r) => (
                <tr key={r.itemId} className="celestial-table-row transition-colors hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-2">
                      <ItemIcon src={r.itemIcon} alt={r.itemName} />
                      {r.itemName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{formatPercent(r.probabilityPercent)}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{formatCurrency(r.expectedDrops)}</td>
                  <td className="px-4 py-2.5">
                    <TextInput
                      type="number"
                      min={0}
                      value={draft[r.itemId] ?? String(r.actualDrops)}
                      onChange={(e) => handleActualChange(r.itemId, e.target.value)}
                      className="w-24"
                    />
                  </td>
                  <td className={`px-4 py-2.5 ${deviationClass(r.deviationPercent)}`}>
                    {formatDeviation(r.deviationPercent)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{formatCurrency(r.itemPrice)}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(r.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="celestial-summary-panel border-t-2 border-gray-200 bg-gray-50 dark:border-white/10">
                <td colSpan={6} className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {t('mainPage.grandTotal')}
                </td>
                <td className="celestial-accent-text px-4 py-3 text-lg font-bold">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
