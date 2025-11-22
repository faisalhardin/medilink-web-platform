import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import idTranslations from './locales/id.json';

const LANGUAGE_KEY = 'app_language';

// Get saved language from localStorage or default to 'id'
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved || 'id';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      id: {
        translation: idTranslations,
      },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;

