import { useState } from 'react';
import { Coins, Plus, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Button, Card, ItemIcon, PageHeader, TextInput } from '../components/ui';
import { formatCurrency, getItemPrice } from '../utils/calculations';

export default function PricesPage() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const { items, prices } = state;

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handlePriceChange = (itemId: string, value: string) => {
    const price = Math.max(0, Number(value) || 0);
    dispatch({ type: 'UPDATE_ITEM_PRICE', payload: { itemId, price } });
  };

  const handleAddItem = () => {
    const name = newName.trim();
    if (!name) return;
    const basePrice = Math.max(0, Number(newPrice) || 0);
    dispatch({ type: 'ADD_ITEM', payload: { name, basePrice } });
    setNewName('');
    setNewPrice('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('prices.title')}
        subtitle={t('prices.subtitle')}
        icon={<Coins className="h-7 w-7 text-current" />}
      />

      <div className="mb-4 flex justify-end">
        <Button variant="secondary" onClick={() => dispatch({ type: 'RESET_ALL_PRICES' })}>
          <RotateCcw className="h-4 w-4" />
          {t('prices.resetAll')}
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="celestial-table-head bg-gray-100 text-left text-gray-600 dark:border-b dark:border-white/10 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('prices.table.name')}</th>
              <th className="px-4 py-3 font-semibold">{t('prices.table.basePrice')}</th>
              <th className="px-4 py-3 font-semibold">{t('prices.table.currentPrice')}</th>
              <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {items.map((item) => {
              const current = getItemPrice(item.id, items, prices);
              const overridden = prices.some((p) => p.itemId === item.id);
              return (
                <tr key={item.id} className="celestial-table-row transition-colors hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-2">
                      <ItemIcon src={item.icon} alt={item.name} />
                      {item.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{formatCurrency(item.basePrice)}</td>
                  <td className="px-4 py-2.5">
                    <TextInput
                      type="number"
                      min={0}
                      value={current}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {overridden && (
                      <Button
                        variant="ghost"
                        title={t('prices.resetOne')}
                        onClick={() => dispatch({ type: 'RESET_ITEM_PRICE', payload: item.id })}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t('prices.addItem')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextInput
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('prices.newItemName')}
            className="flex-1"
          />
          <TextInput
            type="number"
            min={0}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder={t('prices.table.basePrice')}
            className="w-full sm:w-40"
          />
          <Button onClick={handleAddItem} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
