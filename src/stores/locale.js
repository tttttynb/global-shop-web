import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n, { SUPPORTED_LOCALES } from '@/i18n'
import { getRates } from '@/api/forex'

/**
 * 语言 + 币种全局状态（Phase 3 - F5）
 * - locale: 界面语言（vue-i18n），持久化 localStorage
 * - currency: 展示币种，持久化 localStorage
 * - rates: 后端汇率表（1 外币 = X 人民币，Redis 缓存 1 小时）
 * - formatPrice(cny): 商品/订单人民币金额 → 当前展示币种格式化文本（参考价）
 */
export const CURRENCY_OPTIONS = [
  { code: 'CNY', symbol: '¥', label: '人民币 CNY', decimals: 2 },
  { code: 'USD', symbol: '$', label: '美元 USD', decimals: 2 },
  { code: 'EUR', symbol: '€', label: '欧元 EUR', decimals: 2 },
  { code: 'GBP', symbol: '£', label: '英镑 GBP', decimals: 2 },
  { code: 'JPY', symbol: 'JP¥', label: '日元 JPY', decimals: 0 },
  { code: 'KRW', symbol: '₩', label: '韩元 KRW', decimals: 0 },
  { code: 'THB', symbol: '฿', label: '泰铢 THB', decimals: 2 }
]

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(localStorage.getItem('locale') || 'zh')
  const currency = ref(localStorage.getItem('currency') || 'CNY')
  const rates = ref({})          // { USD: 7.10, JPY: 0.048, ... } 1外币=X人民币
  const ratesUpdatedAt = ref(null)
  const ratesLoaded = ref(false)

  const currencyOption = computed(
    () => CURRENCY_OPTIONS.find(c => c.code === currency.value) || CURRENCY_OPTIONS[0]
  )
  const localeOption = computed(
    () => SUPPORTED_LOCALES.find(l => l.code === locale.value) || SUPPORTED_LOCALES[0]
  )

  function setLocale(code) {
    locale.value = code
    localStorage.setItem('locale', code)
    i18n.global.locale.value = code
  }

  function setCurrency(code) {
    currency.value = code
    localStorage.setItem('currency', code)
  }

  /** 加载汇率表（App 启动时调用一次；切换币种无需重新加载） */
  async function loadRates() {
    try {
      const res = await getRates()
      if (res.code === 200 && Array.isArray(res.data)) {
        const map = {}
        for (const r of res.data) {
          map[r.currencyCode] = Number(r.rateToCny)
        }
        rates.value = map
        const cnyRow = res.data.find(r => r.currencyCode === 'CNY')
        ratesUpdatedAt.value = cnyRow?.updateTime || null
        ratesLoaded.value = true
      }
    } catch {
      ratesLoaded.value = false // 汇率不可用 → 仅 CNY 展示（降级）
    }
  }

  /** 人民币金额 → 当前展示币种数值；汇率缺失返回 null（调用方回退 CNY） */
  function convert(cnyAmount) {
    const amt = Number(cnyAmount)
    if (isNaN(amt)) return null
    if (currency.value === 'CNY') return amt
    const rate = rates.value[currency.value]
    if (!rate) return null
    return amt / rate
  }

  /** 金额格式化：¥199.00 / $27.60 / JP¥4,146（展示层统一"参考价"口径） */
  function formatPrice(cnyAmount) {
    const opt = currencyOption.value
    const v = convert(cnyAmount)
    if (v === null) {
      // 汇率未加载/币种不支持：回退人民币展示
      const amt = Number(cnyAmount) || 0
      return '¥' + amt.toFixed(2)
    }
    return opt.symbol + v.toFixed(opt.decimals)
  }

  /** 某币种对人民币的汇率（展示"1 JPY = 0.048 CNY"用） */
  function rateOf(code) {
    if (!code || code === 'CNY') return 1
    return rates.value[code] || null
  }

  return {
    locale, currency, rates, ratesUpdatedAt, ratesLoaded,
    currencyOption, localeOption,
    setLocale, setCurrency, loadRates, convert, formatPrice, rateOf
  }
})
