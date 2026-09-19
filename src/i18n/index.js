// vue-i18n 入口（Phase 3 - F5 多语言国际化）
// 界面层四语：中/英/日/韩；商品文案由后端 AI 翻译（product_translation），随 Accept-Language/lang 返回
import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'
import ja from './locales/ja'
import ko from './locales/ko'

export const SUPPORTED_LOCALES = [
  { code: 'zh', label: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' }
]

const i18n = createI18n({
  legacy: false,           // Composition API 模式
  globalInjection: true,   // 模板里可直接用 $t
  locale: localStorage.getItem('locale') || 'zh',
  fallbackLocale: 'zh',    // 缺失文案回退中文，保证不出现裸 key
  messages: { zh, en, ja, ko }
})

export default i18n
