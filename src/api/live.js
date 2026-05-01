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
