import request from './request'

/** 全量汇率表（含 CNY 基准行），Phase 3 - F5 */
export function getRates() {
  return request.get('/forex/rates')
}

/** 金额换算 amount(from) → to */
export function convertCurrency(amount, from = 'CNY', to = 'CNY') {
  return request.get('/forex/convert', { params: { amount, from, to } })
}

/** 手动刷新汇率（演示/运维） */
export function refreshRates() {
  return request.post('/forex/refresh')
}
