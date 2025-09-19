import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocationData } from './firebase/utils';

import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';

const resources = {
  vi: {
    translation: viTranslations
  },
  en: {
    translation: enTranslations
  }
};

// Inicializar i18n de forma síncrona primeiro
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // idioma padrão temporário
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Função para detectar idioma baseado na localização (executada após inicialização)
const detectLanguageByLocation = async () => {
  try {
    console.log('🌍 Detectando idioma baseado na localização...');
    const locationData = await getLocationData();
    
    // Verificar se o usuário está no Vietnã
    const isVietnam = 
      locationData.countryCode === 'VN' || 
      locationData.country === 'Vietnam' ||
      locationData.country === 'Viet Nam';
    
    const detectedLanguage = isVietnam ? 'vi' : 'en';
    
    console.log('🌍 Localização detectada:', {
      country: locationData.country,
      countryCode: locationData.countryCode,
      isVietnam,
      detectedLanguage
    });
    
    // Atualizar idioma se necessário
    if (i18n.language !== detectedLanguage) {
      await i18n.changeLanguage(detectedLanguage);
      console.log(`🌐 Idioma atualizado para: ${detectedLanguage}`);
    }
    
    return detectedLanguage;
  } catch (error) {
    console.warn('⚠️ Erro na detecção de localização, mantendo idioma atual:', error);
    return i18n.language;
  }
};

// Detectar idioma após a inicialização (não bloqueia o carregamento)
setTimeout(() => {
  detectLanguageByLocation();
}, 100);

export default i18n;