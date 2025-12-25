import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import fr from './locales/fr';
import de from './locales/de';
import es from './locales/es';
import ru from './locales/ru';
import it from './locales/it';
import pt from './locales/pt';

export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'it' | 'pt';

export const languages: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
};

const translations: Record<Language, any> = {
  en,
  zh,
  ja,
  ko,
  fr,
  de,
  es,
  ru,
  it,
  pt
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // 自动检测浏览器系统语言
  const browserLang = navigator.language.toLowerCase();
  const langCode = browserLang.split('-')[0] as Language;
  
  if (langCode in translations) return langCode;
  
  // 默认英语
  return 'en';
}

export function setLanguage(lang: Language) {
  // 不再保存到localStorage，仅检测系统语言
  // 这个方法保留是为了兼容性，但不再执行任何操作
}

