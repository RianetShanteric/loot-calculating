import { useMemo, useState } from 'react';
import { Dices, ExternalLink, Gift, PackageOpen } from 'lucide-react';
import { Button, Card, FieldLabel, PageHeader, Select, TextInput } from '../components/ui';
import { useAppContext } from '../context/useAppContext';
import { donationChests, validateDonationChestData } from '../data/donationChests';
import { useTranslation } from '../hooks/useTranslation';
import { deviationClass, formatDeviation, formatNumber } from '../utils/calculations';
import { genId } from '../utils/id';
import { runDonationChestSimulation, type DonationSimulationRun } from '../utils/simulation';

const MAX_OPENINGS = 1_000_000;
const WARN_THRESHOLD = 100_000;
const OPENING_PRESETS = [1, 10, 100, 1_000, 10_000];

function RewardIcon({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
  return (
    <span
      className="simulator-item-icon inline-grid shrink-0 place-items-center overflow-hidden rounded-lg"
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
    </span>
  );
}

function formatChance(value: number, language: 'ru' | 'en') {
  return `${value.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}%`;
}

export default function SimulatorPage() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const [chestId, setChestId] = useState(donationChests[0]?.id ?? '');
  const [openings, setOpenings] = useState(100);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [run, setRun] = useState<DonationSimulationRun | null>(null);

  const selectedChest = donationChests.find((chest) => chest.id === chestId) ?? donationChests[0];
  const resultByRewardId = useMemo(
    () => new Map(run?.results.map((result) => [result.rewardId, result]) ?? []),
    [run]
  );
  const droppedRewards = useMemo(
    () =>
      run
        ? run.results
            .filter((result) => result.actualHits > 0)
            .sort((left, right) => right.actualHits - left.actualHits || right.totalQuantity - left.totalQuantity)
        : [],
    [run]
  );
  const dataIsValid = selectedChest ? validateDonationChestData(selectedChest) : false;

  const setSafeOpenings = (value: number) => {
    setOpenings(Math.max(1, Math.min(MAX_OPENINGS, Math.round(value || 1))));
  };

  const handleRun = async () => {
    if (!selectedChest || !dataIsValid) return;
    setIsSimulating(true);
    setProgress(0);
    const result = await runDonationChestSimulation(selectedChest, openings, setProgress);
    setRun(result);
    setIsSimulating(false);

    dispatch({
      type: 'ADD_SIMULATION_HISTORY',
      payload: {
        id: genId(),
        kind: 'donation',
        chestId: selectedChest.id,
        chestName: selectedChest.name,
        simulations: openings,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('simulator.title')}
        subtitle={t('simulator.subtitle')}
        icon={<Dices className="h-7 w-7 text-current" />}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <span className="celestial-section-icon"><Gift className="h-5 w-5" /></span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('simulator.parametersTitle')}</h2>
            </div>

            {selectedChest && (
              <div className="simulator-chest-hero mb-5 flex items-center gap-4 rounded-xl p-4">
                <RewardIcon src={selectedChest.icon} alt={selectedChest.name} size={64} />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-gray-900 dark:text-white">{selectedChest.name}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedChest.rewards.length} {t('simulator.rewardVariants')}
                  </p>
                  <a
                    href={selectedChest.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-600 dark:text-sky-300"
                  >
                    {t('simulator.sourceLink')} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="mb-4">
              <FieldLabel>{t('simulator.chestLabel')}</FieldLabel>
              <Select
                value={chestId}
                onChange={(event) => {
                  setChestId(event.target.value);
                  setRun(null);
                }}
              >
                {donationChests.map((chest) => (
                  <option key={chest.id} value={chest.id}>{chest.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel>{t('simulator.simulationsLabel')}</FieldLabel>
              <TextInput
                aria-label={t('simulator.simulationsLabel')}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_OPENINGS}
                value={openings}
                onChange={(event) => setSafeOpenings(Number(event.target.value))}
              />
              <div className="mt-2 grid grid-cols-5 gap-1.5" aria-label={t('simulator.quickAmounts')}>
                {OPENING_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={openings === preset}
                    onClick={() => setSafeOpenings(preset)}
                    className={`simulator-preset whitespace-nowrap rounded-lg px-1 py-2 text-xs font-semibold transition-colors ${
                      openings === preset ? 'simulator-preset-active' : ''
                    }`}
                  >
                    {formatNumber(preset)}
                  </button>
                ))}
              </div>
            </div>

            {openings > WARN_THRESHOLD && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{t('simulator.warningOverLimit')}</p>
            )}
            {!dataIsValid && (
              <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">{t('simulator.invalidData')}</p>
            )}

            <Button className="mt-5 w-full py-3" onClick={handleRun} disabled={isSimulating || !dataIsValid}>
              <PackageOpen className="h-5 w-5" />
              {isSimulating ? t('simulator.progress') : t('simulator.runButton')}
            </Button>

            {isSimulating && (
              <div className="mt-4" aria-live="polite">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className="celestial-progress h-full rounded-full transition-[width] duration-150"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(progress * 100)}%
                </p>
              </div>
            )}
          </Card>

        </div>

        <Card className="min-h-[32rem]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('simulator.resultsTitle')}</h2>
            {run && (
              <span className="celestial-total-chip">
                {t('simulator.openedTotal')} <strong>{formatNumber(run.totalOpenings)}</strong>
              </span>
            )}
          </div>

          {!run ? (
            <div className="flex min-h-[25rem] flex-col items-center justify-center px-4 text-center">
              {selectedChest && <RewardIcon src={selectedChest.icon} alt={selectedChest.name} size={84} />}
              <p className="mt-5 text-base font-semibold text-gray-700 dark:text-gray-200">{t('simulator.emptyTitle')}</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">{t('simulator.selectChestFirst')}</p>
            </div>
          ) : (
            <>
              <div className="simulator-summary mb-5 grid grid-cols-1 gap-3 rounded-xl p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('simulator.openedTotal')}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatNumber(run.totalOpenings)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('simulator.uniqueRewards')}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatNumber(run.uniqueRewards)}</p>
                </div>
              </div>

              <div className="mb-2 flex justify-end text-xs text-gray-500 dark:text-gray-400">
                <span>{t('simulator.sortedByDrops')}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {droppedRewards.map((result) => (
                  <div key={result.rewardId} className="simulator-result-row flex min-w-0 items-center gap-2.5 rounded-xl p-2.5">
                    <RewardIcon src={result.itemIcon} alt={result.itemName} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="simulator-result-name text-sm font-semibold leading-4 text-gray-900 dark:text-gray-100" title={result.itemName}>
                        {result.itemName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                        {formatChance(result.chancePercent, state.language)}
                        {result.quantityPerDrop > 1 ? ` / ${t('simulator.stack')}: ${formatNumber(result.quantityPerDrop)}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 border-l border-gray-200 pl-2.5 text-right dark:border-white/10">
                      <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatNumber(result.totalQuantity)}
                      </p>
                      <p className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                        {formatNumber(result.actualHits)} {t('simulator.timesShort')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {selectedChest && (
        <Card className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('simulator.contentsTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('simulator.contentsSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {selectedChest.rewards.map((reward) => {
              const result = resultByRewardId.get(reward.id);
              return (
                <div key={reward.id} className="simulator-result-row flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2">
                  <RewardIcon src={reward.icon} alt={reward.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100" title={reward.name}>
                      {reward.name}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                      {formatChance(reward.chancePercent, state.language)}
                      {' · '}{t('simulator.table.stack')}: {formatNumber(reward.quantity)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[10px] tabular-nums">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {result ? `${formatNumber(result.actualHits)} ${t('simulator.timesShort')}` : '0'}
                    </p>
                    <p className={deviationClass(result?.deviationPercent ?? null)}>
                      {result ? formatDeviation(result.deviationPercent) : '0%'}
                    </p>
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
