import request from './request'

/** 到手价试算：预估到手价 = 商品价 + 国际运费 + 跨境综合税（Phase 3 - F6） */
export function getTaxEstimate(productId, skuId = null, quantity = 1, destination = 'CN') {
  return request.get('/tax/estimate', { params: { productId, skuId, quantity, destination } })
}

/** 全部税率规则（品类 × 目的国档位） */
export function getTaxRules() {
  return request.get('/tax/rules')
}
