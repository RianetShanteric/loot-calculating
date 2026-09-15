import { useState } from 'react';
import { PieChart, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Badge, Button, Card, FieldLabel, ItemIcon, PageHeader, Select, TextInput } from '../components/ui';
import { formatPercent } from '../utils/calculations';

export default function ProbabilitiesPage() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const { chests, items, probabilities } = state;

  const [chestId, setChestId] = useState(chests[0]?.id ?? '');

  const rows = probabilities.filter((p) => p.chestId === chestId);

  const chanceSumByItem = new Map<string, number>();
  rows.forEach((r) => chanceSumByItem.set(r.itemId, (chanceSumByItem.get(r.itemId) ?? 0) + r.chancePercent));

  const handleAddRow = () => {
    if (!chestId) return;
    const usedItemIds = new Set(rows.map((r) => r.itemId));
    const nextItem = items.find((i) => !usedItemIds.has(i.id)) ?? items[0];
    if (!nextItem) return;
    dispatch({
      type: 'ADD_PROBABILITY',
      payload: { chestId, itemId: nextItem.id, chancePercent: 0, quantity: 1 },
    });
  };

  const maxChance = Math.max(100, ...rows.map((r) => r.chancePercent));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('probabilities.title')}
        subtitle={t('probabilities.subtitle')}
        icon={<PieChart className="h-7 w-7 text-current" />}
      />

      <Card className="mb-6">
        <FieldLabel>{t('probabilities.selectChest')}</FieldLabel>
        <Select value={chestId} onChange={(e) => setChestId(e.target.value)} className="max-w-sm">
          {chests.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('probabilities.independentNote')}</p>
      </Card>

      <Card className="mb-6 overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="celestial-table-head bg-gray-100 text-left text-gray-600 dark:border-b dark:border-white/10 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('probabilities.table.item')}</th>
              <th className="px-4 py-3 font-semibold">{t('probabilities.table.chance')}</th>
              <th className="px-4 py-3 font-semibold">{t('probabilities.table.quantity')}</th>
              <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((row) => {
              const itemSum = chanceSumByItem.get(row.itemId) ?? 0;
              const duplicateOver100 =
                rows.filter((r) => r.itemId === row.itemId).length > 1 && itemSum > 100;
              return (
                <tr key={row.id} className="celestial-table-row transition-colors hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Select
                      value={row.itemId}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_PROBABILITY', payload: { ...row, itemId: e.target.value } })
                      }
                      className="min-w-[180px]"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </Select>
                    {duplicateOver100 && (
                      <div className="mt-1">
                        <Badge tone="warning">{t('probabilities.duplicateWarning')}</Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={row.chancePercent}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_PROBABILITY',
                          payload: {
                            ...row,
                            chancePercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          },
                        })
                      }
                      className="w-28"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <TextInput
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_PROBABILITY',
                          payload: { ...row, quantity: Math.max(1, Math.round(Number(e.target.value) || 1)) },
                        })
                      }
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Button
                      variant="ghost"
                      title={t('common.delete')}
                      onClick={() => dispatch({ type: 'DELETE_PROBABILITY', payload: row.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Button variant="secondary" className="mb-6" onClick={handleAddRow}>
        <Plus className="h-4 w-4" />
        {t('probabilities.addRow')}
      </Button>

      {rows.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t('probabilities.distributionTitle')}
          </h2>
          <div className="space-y-2">
            {rows.map((row) => {
              const item = items.find((i) => i.id === row.itemId);
              const widthPct = maxChance > 0 ? (row.chancePercent / maxChance) * 100 : 0;
              return (
                <div key={row.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
                  <span
                    className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300 sm:w-40"
                    title={item?.name}
                  >
                    <ItemIcon src={item?.icon} alt={item?.name ?? ''} size={20} />
                    <span className="truncate">{item?.name}</span>
                  </span>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                      <div
                        className="celestial-progress h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, widthPct)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-medium text-gray-600 dark:text-gray-400">
                      {formatPercent(row.chancePercent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
