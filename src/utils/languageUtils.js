// 🌍 Language Utils - Utilitários para detecção e formatação de idiomas

/**
 * Detecta o idioma do navegador e retorna o nome formatado
 * @param {string} languageCode - Código do idioma (ex: 'pt-BR', 'en-US')
 * @returns {string} Nome do idioma formatado
 */
export const getDetectedLanguageDisplayName = (languageCode = null) => {
  try {
    // Usar o código fornecido ou detectar automaticamente
    const code = languageCode || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    
    // Mapeamento de códigos de idioma para nomes formatados
    const languageMap = {
      'pt-BR': 'Português (Brasil)',
      'pt': 'Português',
      'en-US': 'English (US)',
      'en': 'English',
      'es': 'Español',
      'es-ES': 'Español (España)',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'ja': '日本語',
      'ko': '한국어',
      'zh-CN': '中文 (简体)',
      'zh-TW': '中文 (繁體)',
      'ru': 'Русский',
      'ar': 'العربية'
    };

    // Retornar nome formatado ou código original se não encontrado
    return languageMap[code] || languageMap[code.split('-')[0]] || code;
  } catch (error) {
    console.warn('Erro ao detectar idioma:', error);
    return 'English';
  }
};

/**
 * Detecta o código do idioma do navegador
 * @returns {string} Código do idioma (ex: 'pt-BR')
 */
export const getDetectedLanguageCode = () => {
  try {
    return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  } catch (error) {
    console.warn('Erro ao detectar código do idioma:', error);
    return 'en-US';
  }
};

/**
 * Verifica se o idioma é RTL (Right-to-Left)
 * @param {string} languageCode - Código do idioma
 * @returns {boolean} True se for RTL
 */
export const isRTLLanguage = (languageCode = null) => {
  const code = languageCode || getDetectedLanguageCode();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(code.split('-')[0]);
};