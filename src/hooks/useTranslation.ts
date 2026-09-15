import { useAppContext } from '../context/useAppContext';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

const translations = { ru, en };

export function useTranslation() {
  const { state } = useAppContext();
  const { language } = state;

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, language };
}
