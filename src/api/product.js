import request from './request'

export function getProductList() {
  return request.get('/product/list')
}

export function getProductListPaged(params) {
  return request.get('/product/list/paged', { params })
}

/** 商品详情；lang 传入时后端返回对应语言的 AI 翻译文案（Phase 3 - F5） */
export function getProductDetail(id, lang = null) {
  return request.get(`/product/detail/${id}`, { params: lang ? { lang } : {} })
}

/** 🆕 商品 SKU 规格列表（Phase 1 - F1） */
export function getProductSkus(id) {
  return request.get(`/product/detail/${id}/skus`)
}

/** 🆕 价格历史走势（Phase 1 - F2），默认近 90 天 */
export function getPriceHistory(id, days = 90) {
  return request.get(`/product/${id}/price-history`, { params: { days } })
}

export function getProductReviews(id) {
  return request.get(`/product/${id}/reviews`)
}

export function searchProducts(keyword, page = 0, size = 10) {
  return request.get('/product/search', { params: { keyword, page, size } })
}

export function toggleFavorite(id) {
  return request.post(`/product/favorite/${id}`)
}

export function getFavorites() {
  return request.get('/product/favorites')
}

export function getProductStats(id) {
  return request.get(`/product/${id}/stats`)
}

export function getAiReviewSummary(id) {
  return request.get(`/product/${id}/ai-summary`, { timeout: 120000 })
}

/** 🆕 AI 口碑档案 2.0（Phase 4 - F9）：持久化档案 + 多语言，lang 跟随界面语言 */
export function getReviewIntelligence(id, lang = null) {
  return request.get(`/product/${id}/review-intelligence`, {
    params: lang ? { lang } : {},
    timeout: 60000
  })
}

export function getHomeFeed() {
  return request.get('/home/feed')
}

/** "看了还看" — ES More Like This（Tier 2.1a） */
export function getSimilarProducts(id, size = 6) {
  return request.get(`/product/${id}/similar`, { params: { size } })
}

/** "买了还买" — 订单共现推荐（Tier 2.1b） */
export function getFrequentlyBought(id, size = 6) {
  return request.get(`/product/${id}/frequently-bought`, { params: { size } })
}

/** "猜你喜欢" — 基于画像的个性化推荐（Tier 2.1c） */
export function getYouMayLike(size = 8) {
  return request.get('/product/you-may-like', { params: { size } })
}

export function getCategoryList() {
  return request.get('/category/list')
}
