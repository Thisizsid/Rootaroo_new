import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ne from './ne';

const options = {
  resources: { en: { translation: en }, ne: { translation: ne } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
};

i18n.use(initReactI18next).init(options);

export default i18n;
