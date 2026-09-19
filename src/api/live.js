import request from './request'

export function createLiveRoom(data) {
  return request.post('/live/create', data)
}

export function startLive(id) {
  return request.post(`/live/start/${id}`)
}

export function stopLive(id) {
  return request.post(`/live/stop/${id}`)
}

export function getLiveList(status) {
  return request.get('/live/list', { params: { status } })
}

export function getLiveDetail(id) {
  return request.get(`/live/${id}/detail`)
}

export function addLiveProducts(id, data) {
  return request.post(`/live/${id}/products`, data)
}

export function setExplainingProduct(id, productId) {
  return request.post(`/live/${id}/explaining/${productId}`)
}

export function toggleAiAssistant(id, enabled) {
  return request.post(`/live/${id}/ai-assistant`, null, { params: { enabled } })
}

export function getHistoryMessages(id, page = 1, size = 50) {
  return request.get(`/live/${id}/messages`, { params: { page, size } })
}

export function getLiveProducts(id) {
  return request.get(`/live/${id}/products`)
}

// ==================== 🆕 直播闪购秒杀（Phase 2 - F3） ====================

/** 主播发起秒杀 */
export function startFlashSale(data) {
  return request.post('/live/flash-sale/start', data)
}

/** 观众抢购（每人限购一次） */
export function buyFlashSale(saleId, quantity = 1) {
  return request.post(`/live/flash-sale/${saleId}/buy`, { quantity })
}

/** 主播提前终止秒杀 */
export function cancelFlashSale(saleId) {
  return request.post(`/live/flash-sale/${saleId}/cancel`)
}

/** 查询直播间进行中的秒杀（观众中途进入恢复卡片） */
export function getActiveFlashSale(roomId) {
  return request.get('/live/flash-sale/active', { params: { roomId } })
}
